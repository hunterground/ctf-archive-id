# Crappy Polls

**Author:** `SleepyBanana`

**Difficulty:** `Medium (?)`

**Category:** `Webex`

## Attachments
- [Provided files](dist/)

## Description

A crappy polls app for a crappy challenge in my crappy day. Nothing fancy here, i hope you enjoy spaghetti code.

## Flag

`ARKAV{ju57_4_73d10u5_4nd_dull_0rm_1nj3c710n_}`

## Connection

**Port：`8137`**

## Write-Up
- [Solver](solve.py)

So basically there exist an ORM injection vulnerability in login_view() which handles the login page.

We can arbitrarily insert exactly 2 parameter to leak each secret message which can be located in either a polls question or polls choices. Leakage can only be seen through error state of login screen. 

The only way we can reliably leak information about a private polls is by having one parameter as the user ID, and the other injection parameter as the text component of what we want to leak.

To know which user ID is the premium user (the premium user holds the secret message), we can use the endpoint /api/status which has a user enumeration vulnerability through timing attack. And to reach that local endpoint, we can utilize the SSRF vulnerability inside the analytics middleware, which can be bypassed through redirection.

There exist a small probability that an exploit could fail due to timing interference from another factor.
