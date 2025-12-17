import unittest
from unittest.mock import MagicMock, patch, AsyncMock
import json

# Import the class to be tested
# Note: Ensure your project structure allows this import, 
# or adjust 'work_order_agent' to match your filename.
from work_order_agent import WorkOrderAssignmentAgent

class TestWorkOrderAssignmentAgent(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        """Setup run before each test"""
        # We don't need to instantiate real connections here because
        # we will patch them at the class/method level.
        self.agent = WorkOrderAssignmentAgent()

        # Sample Mock Data
        self.mock_wo_context = {
            "work_order": {
                "id": "WO-123",
                "title": "Fix Conveyor Belt",
                "priority": "High", # Triggers risk factor
                "description": "Belt slipping on Line 4"
            },
            "equipment": {
                "name": "Conveyor 4",
                "criticality": "Critical" # Triggers risk factor
            },
            "facility": {"name": "Plant A"}
        }

        self.mock_technicians = [
            {"id": "T1", "name": "Alice", "role": "Senior Tech"},
            {"id": "T2", "name": "Bob", "role": "Junior Tech"}
        ]

    @patch("work_order_agent.ManufacturingKGQueryEngine")
    @patch("work_order_agent.ChatOpenAI")
    async def test_assign_work_order_success(self, MockLLM, MockKG):
        """
        Test the 'Happy Path':
        1. Context is found.
        2. Technicians are found.
        3. Compliance passes.
        4. LLM ranks them.
        """
        # --- 1. SETUP MOCKS ---
        
        # Mock KG Engine behavior
        mock_kg_instance = MockKG.return_value
        mock_kg_instance.get_workorder_context.return_value = self.mock_wo_context
        mock_kg_instance.find_qualified_technicians_for_workorder.return_value = self.mock_technicians
        
        # Mock LLM behavior
        mock_llm_instance = MockLLM.return_value
        # The agent calls llm.invoke() which returns an object with .content
        mock_response = MagicMock()
        mock_response.content = "Based on experience, Alice is the best fit."
        mock_llm_instance.invoke.return_value = mock_response

        # --- 2. EXECUTE ---
        result = await self.agent.assign_work_order("WO-123")

        # --- 3. ASSERTIONS ---

        # Check if Recommendations were set
        self.assertEqual(result["recommended_technician"]["name"], "Alice")
        self.assertEqual(result["alternative_candidates"][0]["name"], "Bob")
        self.assertIn("Alice is the best fit", result["justification"])

        # Check Risk Analysis Logic (High Priority + Critical Equipment)
        risk_factors = result["risk_factors"]
        self.assertTrue(any("High priority" in r for r in risk_factors))
        self.assertTrue(any("Critical equipment" in r for r in risk_factors))

        # Ensure no errors
        self.assertEqual(result["errors"], [])

    @patch("work_order_agent.ManufacturingKGQueryEngine")
    async def test_work_order_not_found(self, MockKG):
        """
        Test Scenario: KG returns empty context (Invalid ID)
        """
        # Setup Mock to return None/Empty
        mock_kg_instance = MockKG.return_value
        mock_kg_instance.get_workorder_context.return_value = {} # Empty context

        # Execute
        result = await self.agent.assign_work_order("INVALID-ID")

        # Assertions
        self.assertTrue(len(result["errors"]) > 0)
        self.assertIn("not found", result["errors"][0])
        # Should not have proceeded to recommendation
        self.assertEqual(result["recommended_technician"], {})

    @patch("work_order_agent.ManufacturingKGQueryEngine")
    async def test_compliance_failure_no_technicians(self, MockKG):
        """
        Test Scenario: Context exists, but NO qualified technicians found.
        Should trigger a compliance error.
        """
        # Setup
        mock_kg_instance = MockKG.return_value
        mock_kg_instance.get_workorder_context.return_value = self.mock_wo_context
        mock_kg_instance.find_qualified_technicians_for_workorder.return_value = [] # No techs

        # Execute
        result = await self.agent.assign_work_order("WO-123")

        # Assertions
        # 1. Compliance check should fail
        self.assertFalse(result["compliance_checks"]["qualified_technicians_available"])
        
        # 2. Risk Factors should include limited pool warning
        self.assertTrue(any("Limited qualified technician pool" in r for r in result["risk_factors"]))
        
        # 3. Error list should explain why
        self.assertTrue(any("No qualified technicians" in e for e in result["errors"]))

    @patch("work_order_agent.ManufacturingKGQueryEngine")
    @patch("work_order_agent.ChatOpenAI")
    async def test_llm_failure_fallback(self, MockLLM, MockKG):
        """
        Test Scenario: LLM API crashes. 
        Agent should fallback to simple ranking (first in list).
        """
        # Setup KG to work fine
        mock_kg_instance = MockKG.return_value
        mock_kg_instance.get_workorder_context.return_value = self.mock_wo_context
        mock_kg_instance.find_qualified_technicians_for_workorder.return_value = self.mock_technicians

        # Setup LLM to crash
        mock_llm_instance = MockLLM.return_value
        mock_llm_instance.invoke.side_effect = Exception("API Timeout")

        # Execute
        result = await self.agent.assign_work_order("WO-123")

        # Assertions
        # Should still have a recommendation (Fallback logic)
        self.assertEqual(result["recommended_technician"]["name"], "Alice")
        # Justification should indicate fallback/error
        self.assertIn("Fallback selection", result["justification"])
        # Errors list should contain the LLM exception
        self.assertTrue(any("AI ranking failed" in e for e in result["errors"]))

if __name__ == "__main__":
    unittest.main()