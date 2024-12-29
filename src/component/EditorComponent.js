import React, { useState, useEffect, useRef } from "react";
import {
  Editor,
  EditorState,
  RichUtils,
  Modifier,
  convertToRaw,
  convertFromRaw,
} from "draft-js";
import "draft-js/dist/Draft.css";
import "./EditorComponent.css"; 

// Custom style map for red color
const styleMap = {
  REDCOLOR: {
    color: "red",
  },
};

function EditorComponent() {
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );
  const editorRef = useRef(null);

  // Loading content from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("editorContent");
    if (savedData) {
      try {
        const content = convertFromRaw(JSON.parse(savedData));
        setEditorState(EditorState.createWithContent(content));
      } catch (e) {
        console.error("Failed to load content from localStorage:", e);
      }
    }
  }, []);

  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // Saving content to localStorage
  const handleSave = () => {
    const content = editorState.getCurrentContent();
    localStorage.setItem(
      "editorContent",
      JSON.stringify(convertToRaw(content))
    );
    alert("Content saved!");
  };

  const handleKeyCommand = (command, currentEditorState) => {
    const newState = RichUtils.handleKeyCommand(currentEditorState, command);
    if (newState) {
      setEditorState(newState);
      return "handled";
    }
    return "not-handled";
  };

  // Defining patterns with all styles as strings
  const patterns = [
    { regex: /^#$/, style: "header-one" },
    { regex: /^\*$/, style: "BOLD" },
    { regex: /^\*\*$/, style: "REDCOLOR" },
    { regex: /^\*\*\*$/, style: "UNDERLINE" },
  ];

  // Detecting patterns when user presses space
  const handleBeforeInput = (input, currentEditorState) => {
    if (input !== " ") {
      return "not-handled";
    }

    const selection = currentEditorState.getSelection();
    const block = currentEditorState
      .getCurrentContent()
      .getBlockForKey(selection.getStartKey());
    const blockText = block.getText();
    const cursorPosition = selection.getStartOffset();
    const textUntilCursor = blockText.substring(0, cursorPosition);

    for (let pattern of patterns) {
      const match = textUntilCursor.match(pattern.regex);
      if (match) {
        const matchedText = match[0];
        const style = pattern.style; 
        // Applying style 
        applyStyle(currentEditorState, selection, matchedText.length, style);
        return "handled";
      }
    }

    return "not-handled";
  };

  // Applying the detected style
  const applyStyle = (currentEditorState, selection, triggerLength, style) => {
    const contentState = currentEditorState.getCurrentContent();

 
    const start = selection.getStartOffset() - triggerLength;
    const end = selection.getStartOffset();

    const safeStart = start < 0 ? 0 : start;


    const newSelection = selection.merge({
      anchorKey: selection.getStartKey(),
      anchorOffset: safeStart,
      focusKey: selection.getStartKey(),
      focusOffset: end,
    });

    let newContentState = Modifier.removeRange(
      contentState,
      newSelection,
      "backward"
    );


    let newEditorState = EditorState.push(
      currentEditorState,
      newContentState,
      "remove-range"
    );

    if (style.startsWith("header-")) {
      newEditorState = RichUtils.toggleBlockType(newEditorState, style);
    } else {
      if (style === "REDCOLOR") {
        const currentStyle = currentEditorState.getCurrentInlineStyle();
        if (currentStyle.has("UNDERLINE")) {
          newEditorState = RichUtils.toggleInlineStyle(
            newEditorState,
            "UNDERLINE"
          );
        }
      }

      const currentInlineStyles = currentEditorState.getCurrentInlineStyle();
      if (currentInlineStyles.has(style)) {
        newEditorState = RichUtils.toggleInlineStyle(newEditorState, style);
      }

    
      newEditorState = RichUtils.toggleInlineStyle(newEditorState, style);
    }

    setEditorState(newEditorState);
  };

  // Defining block styles
  const blockStyleFn = (contentBlock) => {
    const type = contentBlock.getType();
    switch (type) {
      case "header-one":
        return "header-one";
      case "header-two":
        return "header-two";
      default:
        return "";
    }
  };

  return (
    <div>
      <button className="save-button" onClick={handleSave}>
        Save
      </button>
      <div className="editor-container" onClick={focusEditor}>
        <Editor
          ref={editorRef}
          editorState={editorState}
          onChange={setEditorState}
          handleKeyCommand={handleKeyCommand}
          handleBeforeInput={handleBeforeInput}
          customStyleMap={styleMap}
          blockStyleFn={blockStyleFn}
          placeholder="Start typing..."
        />
      </div>
    </div>
  );
}

export default EditorComponent;