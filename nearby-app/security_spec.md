# Firestore Security Specification & Threat Model

This document outlines the security invariants, malicious payload test cases, and rule validation for the Nearby Radar application.

## 1. Data Invariants
1. A user can only read, write, create, or update their own user document at `/users/{userId}` where `userId == request.auth.uid`.
2. A user can only access messages inside `/users/{userId}/messages` where `userId == request.auth.uid`.
3. A user can only manage stories inside `/users/{userId}/stories` where `userId == request.auth.uid`.
4. Role spoofing is prevented. Privilege escalation or writing system keys is prohibited.

## 2. The "Dirty Dozen" Payloads (Malicious Test Bed)

1. **Identity Theft Create**: Attempting to create a user profile for a different UID.
2. **Identity Spoofing Update**: Authenticated as `user-A`, trying to update `user-B` profile.
3. **Ghost Field Write**: Trying to write un-whitelisted, undocumented fields to profile document.
4. **Subscription Bypass Write**: Trying to set `isSubscribed: true` without completing the payment protocol (simulated or real).
5. **Unauthorized Message Read**: User-A attempting to read User-B's private messages sub-collection.
6. **Malicious Message Injection**: User-A trying to inject a message into User-B's messages.
7. **Junk ID Poisoning**: Trying to create a narrative Story with an ID of 1000 characters or containing special characters to trigger wallet denial.
8. **Story Spoofing**: Attempting to post a narrative story under someone else's user space.
9. **Role Escalation**: Attempting to set admin roles or privileges on the user entity.
10. **Temporal Bypass**: Setting a future or historical timestamp to fake messaging timelines instead of `request.time`.
11. **Size Limit Abuse**: Injecting a text message that is 1MB in length to trigger excessive resource consumption.
12. **Blanket Query Scraping**: Attempting to query `/users` or listing all messages without specifying strict relational ownership bounds.

## 3. Security Rules draft (`firestore.rules`)
All these threat vectors are fully locked down by the zero-trust rules implemented.
