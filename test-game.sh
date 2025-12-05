#!/bin/bash
# Simple test of the game

echo "Testing Zork I Rewrite..."
echo ""

# Send commands to the game
{
  echo "look"
  sleep 0.5
  echo "north"
  sleep 0.5
  echo "look"
  sleep 0.5
  echo "south"
  sleep 0.5
  echo "open mailbox"
  sleep 0.5
  echo "take leaflet"
  sleep 0.5
  echo "read leaflet"
  sleep 0.5
  echo "inventory"
  sleep 0.5
  echo "quit"
} | npx tsx src/main.ts
