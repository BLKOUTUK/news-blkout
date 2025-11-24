#!/usr/bin/env python3
"""
Approve pending events in the BLKOUT Events Calendar
This script approves legitimate community events and archives old test events
"""
import requests
import json
from datetime import datetime, timedelta

# API Configuration
EVENTS_API_BASE = "https://events-blkout.vercel.app/api"
ADMIN_PASSWORD = "BLKOUT2025!"

# Event IDs to approve (legitimate community events with dates >= Nov 22, 2025)
EVENTS_TO_APPROVE = [
    "03fa28be-2b44-4d47-a318-7135842256ac",  # Sistermatic Xmas Party (Dec 27)
    "4d79fb2a-0e64-4c9e-b89e-ed593ac40ac3",  # Shaded Writers (Dec 24)
    "7cb852cf-1388-483b-a443-0f5a0b6f4faf",  # Word Benders (Dec 2)
    "18da95f8-8136-4b1e-8e23-6994773cc272",  # SEASONED @ STUDIO 338 (Nov 29)
    "f2c749e5-6392-446d-84f8-4175e638de49",  # World AIDS Day Special (Nov 28)
    "eff2defa-93e9-45f4-95e1-71ead692837f",  # HIV Nude Exhibit (Nov 28)
    "114b2123-7a5b-459f-830f-b333fe18d3b3",  # Collaboration Panel (Nov 22)
]

# Event IDs to archive (test events and old events)
EVENTS_TO_ARCHIVE = [
    "c802b244-2df6-4f56-9ad2-8f4c403268c2",  # Duplicate SEASONED
    "3ed7e9a9-4a3f-4a22-b445-9436b1754c15",  # Test Event from Extension
    "8bd3eabe-1a98-462f-9daa-2cfe69ecc0f6",  # Test
    "a08c2ff1-638f-4dc6-ae33-5cc2123334f6",  # Test Form Event
    "6110be4b-680d-4234-8caa-19b984a44071",  # Community Test Event
    "8990b608-a670-4e91-8bb8-cef0ae0b4609",  # Extension Test
    "11ce1723-c286-4c7c-9c5e-ddbd4c995526",  # Test Event
    "10dd3598-a96a-4185-8124-405cfe72aac1",  # Test Event
    "203595c7-7dc6-4e3d-b514-76830ada56ff",  # Final Test Event
    "68c0091a-d2d7-402c-a86a-b5349d90085b",  # Another Test Event (2024)
    "5330da7a-bba3-41cc-8f3a-3caab661427d",  # Test Community Event (2024)
    "eb9926d1-89ef-4409-9011-62a81fbecb40",  # High Priority Event (2024)
]

def moderate_event(event_id: str, action: str) -> bool:
    """
    Moderate an event using the moderate-content API

    Args:
        event_id: The event ID to moderate
        action: 'approve' or 'reject'

    Returns:
        True if successful, False otherwise
    """
    url = f"{EVENTS_API_BASE}/moderate-content"

    headers = {
        "Content-Type": "application/json",
        "x-admin-password": ADMIN_PASSWORD
    }

    payload = {
        "action": action,
        "eventId": event_id
    }

    try:
        response = requests.post(url, json=payload, headers=headers)

        if response.status_code == 200:
            result = response.json()
            return result.get('success', False)
        else:
            print(f"  ❌ Error: HTTP {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"  ❌ Exception: {e}")
        return False

def main():
    print("🎯 BLKOUT Events Calendar - Event Approval Script")
    print("=" * 60)
    print()

    # Approve legitimate events
    print("✅ APPROVING COMMUNITY EVENTS")
    print("-" * 60)
    approved_count = 0
    for event_id in EVENTS_TO_APPROVE:
        print(f"Approving event {event_id[:8]}...", end=" ")
        if moderate_event(event_id, "approve"):
            print("✓ Approved")
            approved_count += 1
        else:
            print("✗ Failed")

    print()
    print(f"✅ Successfully approved {approved_count}/{len(EVENTS_TO_APPROVE)} events")
    print()

    # Archive test events
    print("🗑️  ARCHIVING TEST EVENTS")
    print("-" * 60)
    archived_count = 0
    for event_id in EVENTS_TO_ARCHIVE:
        print(f"Archiving event {event_id[:8]}...", end=" ")
        if moderate_event(event_id, "reject"):
            print("✓ Archived")
            archived_count += 1
        else:
            print("✗ Failed")

    print()
    print(f"🗑️  Successfully archived {archived_count}/{len(EVENTS_TO_ARCHIVE)} test events")
    print()

    # Summary
    print("=" * 60)
    print("📊 SUMMARY")
    print("-" * 60)
    print(f"✅ Approved: {approved_count} community events")
    print(f"🗑️  Archived: {archived_count} test events")
    print()
    print("🎉 Events should now be visible at:")
    print("   https://events-blkout.vercel.app")
    print()

if __name__ == "__main__":
    main()
