#!/bin/bash
# Simple System Utility Script
# Author: ChatGPT

LOGFILE="sysutil.log"
BASEDIR="./MySimulatedFS"
COUNT=0

# Initialize log
echo "Initializing System Utility at $(date)" > "$LOGFILE"

# Create base directory
if [ ! -d "$BASEDIR" ]; then
  mkdir -p "$BASEDIR"/{Docs,Images,Temp}
  echo "$(date): Created base directory and subdirectories" >> "$LOGFILE"
fi

# Create dummy files
echo "Creating dummy files..."
echo "Sample document 1" > "$BASEDIR/Docs/doc1.txt"
echo "Sample document 2" > "$BASEDIR/Docs/doc2.txt"
touch "$BASEDIR/Images/image1.jpg"
echo "Temp data" > "$BASEDIR/Temp/tempfile.tmp"
echo "$(date): Dummy files created" >> "$LOGFILE"

# Simulate processing
for i in {1..5}; do
  echo "Processing item $i..."
  echo "$(date): Processed item $i" >> "$LOGFILE"
  sleep 1
done

# Display menu
while true; do
  echo ""
  echo "==== MENU ===="
  echo "1) View log"
  echo "2) Add log entry"
  echo "3) Clean temp"
  echo "4) Exit"
  read -p "Choose an option: " choice

  case $choice in
    1)
      cat "$LOGFILE"
      ;;
    2)
      read -p "Enter log entry: " entry
      echo "$(date): $entry" >> "$LOGFILE"
      ;;
    3)
      rm -f "$BASEDIR/Temp/"*
      echo "$(date): Temp cleaned" >> "$LOGFILE"
      ;;
    4)
      echo "Exiting..."
      echo "$(date): User exited" >> "$LOGFILE"
      break
      ;;
    *)
      echo "Invalid option!"
      ;;
  esac
done
