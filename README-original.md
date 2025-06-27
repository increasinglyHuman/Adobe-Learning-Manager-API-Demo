# ⚠️ ALM KAWAII QUIZ - SEPARATE PROJECT ⚠️

## DO NOT CONFUSE WITH JAZZYPOP!

This directory contains the Adobe Learning Manager (ALM) integrated version of Kawaii Quiz.

**This is NOT part of the JazzyPop project!**

## Location
- ALM Quiz: `~/Documents/ALM-Kawaii-Quiz/`
- JazzyPop: `~/Documents/Merlin/JazzyPop/`

## Purpose
This is the quiz component that runs inside Adobe Learning Manager as an embedded widget.

## Key Differences from JazzyPop
- This uses URL parameters from ALM for authentication
- This has quiz builder for instructors and quiz player for learners
- This integrates with ALM's API
- This is a standalone component, not part of the JazzyPop dashboard

## Current Issue Being Fixed
ALM is sending multiple `authToken` parameters in the URL. We need to identify which one is the API token vs the natext token.

## Deployment
This version is deployed at: https://p0qp0q.com/kawaii-quiz/

## DO NOT MIX FILES BETWEEN PROJECTS!