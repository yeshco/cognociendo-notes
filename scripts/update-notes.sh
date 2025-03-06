#!/bin/bash

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Set the notes directory to the parent directory of the scripts folder
NOTES_DIR="$(dirname "$SCRIPT_DIR")"

echo "Checking for modified and untracked Markdown files in $NOTES_DIR..."

# Get modified files (only existing files)
MODIFIED_FILES=$(git -C "$NOTES_DIR" diff --name-only | grep "\.md$" | grep -v "README.md" | xargs -I{} sh -c "[ -f \"$NOTES_DIR/{}\" ] && echo {}")

# Get untracked files
UNTRACKED_FILES=$(git -C "$NOTES_DIR" ls-files --others --exclude-standard | grep "\.md$" | grep -v "README.md")

# Combine all files
ALL_FILES=$(echo -e "${MODIFIED_FILES}\n${UNTRACKED_FILES}" | sort | uniq)

# Display the files
echo "Modified Markdown files:"
if [ -z "$MODIFIED_FILES" ]; then
  echo "None"
else
  echo "$MODIFIED_FILES"
fi

echo -e "\nUntracked Markdown files:"
if [ -z "$UNTRACKED_FILES" ]; then
  echo "None"
else
  echo "$UNTRACKED_FILES"
fi

echo -e "\nAll Markdown files to process:"
if [ -z "$ALL_FILES" ]; then
  echo "None"
else
  echo "$ALL_FILES"
fi

# Process modified files
if [ -n "$MODIFIED_FILES" ]; then
  echo -e "\nProcessing modified files..."
  
  # Save the original IFS
  OIFS="$IFS"
  # Set IFS to newline
  IFS=$'\n'
  
  # Loop through each modified file
  for file in $MODIFIED_FILES; do
    if [ -n "$file" ] && [ -f "$NOTES_DIR/$file" ]; then
      echo -e "\nProcessing modified file: $file"
      
      # Get the full path to the file
      full_path="$NOTES_DIR/$file"
      
      # Check if the file has frontmatter (starts with {)
      if [[ $(head -1 "$full_path") == "{"* ]]; then
        echo "JSON frontmatter found."
        
        # Find the line number where the frontmatter ends
        frontmatter_end_line=$(grep -n "^}$" "$full_path" | head -1 | cut -d: -f1)
        
        if [ -z "$frontmatter_end_line" ]; then
          echo "Error: Could not find the end of frontmatter. Skipping file."
          continue
        fi
        
        # Extract just the frontmatter for analysis
        frontmatter=$(head -n "$frontmatter_end_line" "$full_path")
        
        # Extract current tags, level, and updated date
        current_tags=$(echo "$frontmatter" | grep -o '"tags": \[[^]]*\]' || echo '"tags": []')
        current_tags=${current_tags#'"tags": '}
        
        # For level, extract the value between quotes
        current_level=$(echo "$frontmatter" | grep -o '"level": "[^"]*"' | sed 's/"level": "//' | sed 's/"$//' || echo "")
        
        # Ask if user wants to update tags and level
        read -p "Do you want to update tags and level? (y/n): " update_tags_level
        
        if [ "$update_tags_level" = "y" ]; then
          echo "Current tags: $current_tags"
          read -p "Enter new tags (comma separated, leave empty to keep current): " tags_input
          
          # If user entered new tags, update them
          if [ -n "$tags_input" ]; then
            # Convert comma-separated tags to JSON array format
            OIFS2="$IFS"
            IFS=','
            read -ra tag_array <<< "$tags_input"
            IFS="$OIFS2"
            
            tags_json="["
            for i in "${!tag_array[@]}"; do
              # Trim whitespace
              tag=$(echo "${tag_array[$i]}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
              tags_json+="\"$tag\""
              # Add comma if not the last element
              if [ $i -lt $((${#tag_array[@]} - 1)) ]; then
                tags_json+=", "
              fi
            done
            tags_json+="]"
          else
            # Keep current tags or use empty array if not found
            if [ -z "$current_tags" ]; then
              tags_json="[]"
            else
              tags_json="$current_tags"
            fi
          fi
          
          echo "Current level: $current_level"
          read -p "Enter new level (e.g. 1.a, 2.b, leave empty to keep current): " level
          
          # If user didn't enter a new level, keep the current one
          if [ -z "$level" ]; then
            level=$current_level
          fi
        else
          # Keep current tags and level, or use defaults if not found
          if [ -z "$current_tags" ]; then
            tags_json="[]"
          else
            tags_json="$current_tags"
          fi
          level=$current_level
        fi
        
        # Ask if user wants to update the date
        read -p "Do you want to update the date to now? (y/n): " update_date
        
        if [ "$update_date" = "y" ]; then
          # Get current date in ISO format with proper milliseconds
          current_date=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
        else
          # Keep the current date or use current time if not found
          current_date=$(echo "$frontmatter" | grep -o '"updated": "[^"]*"' | sed 's/"updated": "//' | sed 's/"$//' || date -u +"%Y-%m-%dT%H:%M:%S.000Z")
        fi
        
        # Create the updated frontmatter
        updated_frontmatter="{
  \"tags\": $tags_json,
  \"level\": \"$level\",
  \"updated\": \"$current_date\"
}"
        
        # Use sed to replace just the frontmatter portion in-place
        # Create a temporary file for the sed command
        temp_file=$(mktemp)
        
        # Replace the frontmatter lines with the updated frontmatter
        sed "1,${frontmatter_end_line}c\\
$updated_frontmatter" "$full_path" > "$temp_file"
        
        # Replace the original file with the temporary file
        mv "$temp_file" "$full_path"
        echo "Updated frontmatter in $file"
      else
        echo "No JSON frontmatter found. Skipping."
      fi
      
      # Ask if user wants to commit the file
      read -p "Do you want to commit $file? (y/n): " commit_answer
      
      if [ "$commit_answer" = "y" ]; then
        # Add the file to git staging
        git -C "$NOTES_DIR" add "$file"
        echo "Added $file to git staging"
        
        # Ask for commit message with default
        read -p "Enter commit message (default: \"Update $file\"): " commit_message
        
        # Use default message if user just presses Enter
        if [ -z "$commit_message" ]; then
          commit_message="Update $file"
        fi
        
        # Commit the file
        git -C "$NOTES_DIR" commit -m "$commit_message"
        echo "Committed with message: $commit_message"
        
        # Ask if user wants to push changes
        read -p "Do you want to push changes? (y/n): " push_answer
        
        if [ "$push_answer" = "y" ]; then
          git -C "$NOTES_DIR" push
          echo "Pushed changes to remote repository"
        fi
      fi
    fi
  done
  
  # Restore the original IFS
  IFS="$OIFS"
  
  echo "Done processing modified files."
fi

# Process untracked files
if [ -n "$UNTRACKED_FILES" ]; then
  echo -e "\nProcessing untracked files..."
  
  # Save the original IFS
  OIFS="$IFS"
  # Set IFS to newline
  IFS=$'\n'
  
  # Loop through each untracked file
  for file in $UNTRACKED_FILES; do
    if [ -n "$file" ] && [ -f "$NOTES_DIR/$file" ]; then
      echo -e "\nProcessing untracked file: $file"
      
      # Get the full path to the file
      full_path="$NOTES_DIR/$file"
      
      # Check if the file already has frontmatter (starts with {)
      if [[ $(head -1 "$full_path") != "{"* ]]; then
        echo "No JSON frontmatter found. Adding new frontmatter."
        
        # Ask for tags
        read -p "Enter tags (comma separated): " tags_input
        
        # Convert comma-separated tags to JSON array format
        tags_json="[]"
        if [ -n "$tags_input" ]; then
          # Split the input by commas and create a JSON array
          OIFS2="$IFS"
          IFS=','
          read -ra tag_array <<< "$tags_input"
          IFS="$OIFS2"
          
          tags_json="["
          for i in "${!tag_array[@]}"; do
            # Trim whitespace
            tag=$(echo "${tag_array[$i]}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
            tags_json+="\"$tag\""
            # Add comma if not the last element
            if [ $i -lt $((${#tag_array[@]} - 1)) ]; then
              tags_json+=", "
            fi
          done
          tags_json+="]"
        fi
        
        # Ask for level
        read -p "Enter level (e.g. 1.a, 2.b): " level
        
        # Get current date in ISO format with proper milliseconds
        current_date=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
        
        # Create the frontmatter
        frontmatter="{
  \"tags\": $tags_json,
  \"level\": \"$level\",
  \"updated\": \"$current_date\"
}"
        
        # Create a temporary file
        temp_file=$(mktemp)
        
        # Add frontmatter to the beginning of the file and append original content
        echo "$frontmatter" > "$temp_file"
        echo -e "\n" >> "$temp_file"
        cat "$full_path" >> "$temp_file"
        
        # Replace the original file with the temporary file
        mv "$temp_file" "$full_path"
        echo "Added JSON frontmatter to $file"
      else
        echo "File already has frontmatter. Skipping."
      fi
      
      # Ask if user wants to commit the file
      read -p "Do you want to commit $file? (y/n): " commit_answer
      
      if [ "$commit_answer" = "y" ]; then
        # Add the file to git staging
        git -C "$NOTES_DIR" add "$file"
        echo "Added $file to git staging"
        
        # Ask for commit message with default
        read -p "Enter commit message (default: \"Add $file\"): " commit_message
        
        # Use default message if user just presses Enter
        if [ -z "$commit_message" ]; then
          commit_message="Add $file"
        fi
        
        # Commit the file
        git -C "$NOTES_DIR" commit -m "$commit_message"
        echo "Committed with message: $commit_message"
        
        # Ask if user wants to push changes
        read -p "Do you want to push changes? (y/n): " push_answer
        
        if [ "$push_answer" = "y" ]; then
          git -C "$NOTES_DIR" push
          echo "Pushed changes to remote repository"
        fi
      fi
    fi
  done
  
  # Restore the original IFS
  IFS="$OIFS"
  
  echo "Done processing untracked files."
fi

echo -e "\nDone checking files."