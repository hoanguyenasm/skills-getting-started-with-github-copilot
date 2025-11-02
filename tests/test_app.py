import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # Basic sanity checks
    assert "Chess Club" in data
    assert "Programming Class" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "tester@example.com"

    # Ensure the test email is not already present
    res = client.get("/activities")
    participants = res.json()[activity]["participants"]
    assert email not in participants

    # Sign up
    res = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert res.status_code == 200
    assert email in client.get("/activities").json()[activity]["participants"]

    # Unregister
    res = client.post(f"/activities/{activity}/unregister", params={"email": email})
    assert res.status_code == 200
    assert email not in client.get("/activities").json()[activity]["participants"]

    # Unregistering again should fail
    res = client.post(f"/activities/{activity}/unregister", params={"email": email})
    assert res.status_code == 400


def test_signup_duplicate_fails():
    activity = "Chess Club"
    existing = "michael@mergington.edu"

    # michael is in the initial data; trying to sign up again should 400
    res = client.post(f"/activities/{activity}/signup", params={"email": existing})
    assert res.status_code == 400
