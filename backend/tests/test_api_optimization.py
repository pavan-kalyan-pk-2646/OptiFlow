from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def sample_payload():
    return {
        "stages": [
            {
                "id": "build",
                "name": "BUILD",
                "strategies": [
                    {
                        "id": "build-standard",
                        "name": "Standard",
                        "time": 8,
                        "cost": 0.08,
                    },
                    {
                        "id": "build-fast",
                        "name": "Fast",
                        "time": 5,
                        "cost": 0.15,
                    },
                    {
                        "id": "build-power",
                        "name": "High Power",
                        "time": 3,
                        "cost": 0.25,
                    },
                ],
            },
            {
                "id": "test",
                "name": "TEST",
                "strategies": [
                    {
                        "id": "test-standard",
                        "name": "Standard",
                        "time": 12,
                        "cost": 0.14,
                    },
                    {
                        "id": "test-parallel",
                        "name": "Parallel",
                        "time": 7,
                        "cost": 0.24,
                    },
                    {
                        "id": "test-power",
                        "name": "High Power",
                        "time": 5,
                        "cost": 0.35,
                    },
                ],
            },
            {
                "id": "deploy",
                "name": "DEPLOY",
                "strategies": [
                    {
                        "id": "deploy-standard",
                        "name": "Standard",
                        "time": 10,
                        "cost": 0.10,
                    },
                    {
                        "id": "deploy-fast",
                        "name": "Fast",
                        "time": 6,
                        "cost": 0.18,
                    },
                ],
            },
        ],
        "deadline": 30,
        "budget": 1.00,
        "objective": "balanced",
    }


def test_root_endpoint():
    response = client.get("/")

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == "OptiFlow API is running."


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "healthy"


def test_optimization_endpoint():
    response = client.post(
        "/optimization/run",
        json=sample_payload(),
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["objective"] == "balanced"

    assert data["total_time"] <= 30
    assert data["total_cost"] <= 1.00

    assert len(data["selected_strategies"]) == 3
    assert len(data["stage_results"]) == 3

    assert data["states_generated"] > 0
    assert data["transitions_evaluated"] > 0
    assert data["total_states_stored"] > 0

    assert data["dp_model"]["state"] == "DP[i][time][cost]"


def test_optimization_time_objective():
    payload = sample_payload()
    payload["objective"] = "time"

    response = client.post(
        "/optimization/run",
        json=payload,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["objective"] == "time"


def test_optimization_cost_objective():
    payload = sample_payload()
    payload["objective"] = "cost"

    response = client.post(
        "/optimization/run",
        json=payload,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["objective"] == "cost"


def test_optimization_impossible_constraints():
    payload = sample_payload()

    payload["deadline"] = 1
    payload["budget"] = 0.01

    response = client.post(
        "/optimization/run",
        json=payload,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is False

    assert (
        data["message"]
        == "No feasible pipeline configuration satisfies "
        "the deadline and budget."
    )


def test_duplicate_stage_ids_are_rejected():
    payload = sample_payload()

    payload["stages"][1]["id"] = "build"

    response = client.post(
        "/optimization/run",
        json=payload,
    )

    assert response.status_code == 422


def test_duplicate_strategy_ids_within_stage_are_rejected():
    payload = sample_payload()

    payload["stages"][0]["strategies"][1]["id"] = (
        "build-standard"
    )

    response = client.post(
        "/optimization/run",
        json=payload,
    )

    assert response.status_code == 422


def test_invalid_objective_is_rejected():
    payload = sample_payload()

    payload["objective"] = "invalid"

    response = client.post(
        "/optimization/run",
        json=payload,
    )

    assert response.status_code == 422


def test_missing_stages_are_rejected():
    payload = sample_payload()

    del payload["stages"]

    response = client.post(
        "/optimization/run",
        json=payload,
    )

    assert response.status_code == 422


def test_invalid_deadline_is_rejected():
    payload = sample_payload()

    payload["deadline"] = 0

    response = client.post(
        "/optimization/run",
        json=payload,
    )

    assert response.status_code == 422


def test_negative_budget_is_rejected():
    payload = sample_payload()

    payload["budget"] = -1

    response = client.post(
        "/optimization/run",
        json=payload,
    )

    assert response.status_code == 422