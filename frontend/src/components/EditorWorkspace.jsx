import { useRef, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Editor } from "@monaco-editor/react";
import { getFileIcon } from "./FileTree";
import ChatPanel from "./ChatPanel";

const getLanguageFromFilename = (filename) => {
  if (!filename) return "plaintext";
  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "py":
      return "python";
    case "html":
      return "html";
    case "css":
      return "css";
    case "json":
      return "json";
    case "md":
      return "markdown";
    case "cpp":
    case "h":
      return "cpp";
    case "java":
      return "java";
    case "go":
      return "go";
    case "rs":
      return "rust";
    default:
      return "plaintext";
  }
};

const LANGUAGE_KEYWORDS = {
  python: [
    "and", "as", "assert", "async", "await", "break", "class", "continue",
    "def", "del", "elif", "else", "except", "False", "finally", "for",
    "from", "global", "if", "import", "in", "is", "lambda", "None",
    "nonlocal", "not", "or", "pass", "raise", "return", "True", "try",
    "while", "with", "yield", "print", "len", "range", "self"
  ],
  cpp: [
    "alignas", "alignof", "and", "and_eq", "asm", "atomic", "auto", "bitand",
    "bitor", "bool", "break", "case", "catch", "char", "char8_t", "char16_t",
    "char32_t", "class", "compl", "concept", "const", "consteval", "constexpr",
    "constinit", "const_cast", "continue", "co_await", "co_return", "co_yield",
    "decltype", "default", "delete", "do", "double", "dynamic_cast", "else",
    "enum", "explicit", "export", "extern", "false", "float", "for", "friend",
    "goto", "if", "inline", "int", "long", "mutable", "namespace", "new",
    "noexcept", "not", "not_eq", "nullptr", "operator", "or", "or_eq", "private",
    "protected", "public", "register", "reinterpret_cast", "requires", "return",
    "short", "signed", "sizeof", "static", "static_assert", "static_cast",
    "struct", "switch", "template", "this", "thread_local", "throw", "true",
    "try", "typedef", "typeid", "typename", "union", "unsigned", "using",
    "virtual", "void", "volatile", "wchar_t", "while", "xor", "xor_eq", "std",
    "cout", "cin", "endl", "vector", "string", "map", "set"
  ],
  java: [
    "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char",
    "class", "const", "continue", "default", "do", "double", "else", "enum",
    "extends", "final", "finally", "float", "for", "goto", "if", "implements",
    "import", "instanceof", "int", "interface", "long", "native", "new", "package",
    "private", "protected", "public", "return", "short", "static", "strictfp",
    "super", "switch", "synchronized", "this", "throw", "throws", "transient",
    "try", "void", "volatile", "while", "String", "System", "out", "println"
  ],
  go: [
    "break", "default", "func", "interface", "select", "case", "defer", "go",
    "map", "struct", "chan", "else", "goto", "package", "switch", "const",
    "fallthrough", "if", "range", "type", "continue", "for", "import", "return",
    "var", "nil", "true", "false", "fmt", "Println", "Printf", "make", "new",
    "append", "len"
  ],
  rust: [
    "as", "async", "await", "break", "const", "continue", "crate", "dyn", "else",
    "enum", "extern", "false", "fn", "for", "if", "impl", "in", "let", "loop",
    "match", "mod", "move", "mut", "pub", "ref", "return", "self", "Self",
    "static", "struct", "super", "trait", "true", "type", "union", "unsafe",
    "use", "where", "while", "println", "format", "vec", "String", "Option",
    "Result", "Some", "None", "Ok", "Err"
  ]
};

const LANGUAGE_SNIPPETS = {
  javascript: [
    { label: "clg", insertText: "console.log(${1:object});", detail: "console.log statement" },
    { label: "fn", insertText: "function ${1:name}(${2:params}) {\n\t${3}\n}", detail: "standard function definition" },
    { label: "afn", insertText: "const ${1:name} = (${2:params}) => {\n\t${3}\n};", detail: "arrow function definition" },
    { label: "ifmain", insertText: "if (${1:condition}) {\n\t${2}\n}", detail: "if block" },
    { label: "fore", insertText: "${1:array}.forEach(${2:item} => {\n\t${3}\n});", detail: "forEach loop" },
    { label: "map", insertText: "${1:array}.map(${2:item} => {\n\t${3}\n});", detail: "map utility" },
    { label: "req", insertText: "const ${1:module} = require('${2:package}');", detail: "CommonJS require" },
    { label: "imp", insertText: "import ${1:module} from '${2:package}';", detail: "ESM import statement" },
  ],
  typescript: [
    { label: "clg", insertText: "console.log(${1:object});", detail: "console.log statement" },
    { label: "fn", insertText: "function ${1:name}(${2:params}): ${3:void} {\n\t${4}\n}", detail: "typed function" },
    { label: "int", insertText: "interface ${1:Name} {\n\t${2:prop}: ${3:type};\n}", detail: "interface definition" },
    { label: "type", insertText: "type ${1:Name} = ${2:Type};", detail: "type alias" },
  ],
  python: [
    { label: "def", insertText: "def ${1:name}(${2:params}):\n\t${3:pass}", detail: "function definition" },
    { label: "class", insertText: "class ${1:ClassName}:\n\tdef __init__(self${2}):\n\t\t${3:pass}", detail: "class definition" },
    { label: "ifmain", insertText: "if __name__ == \"__main__\":\n\t${1:main()}", detail: "if main block" },
    { label: "print", insertText: "print(${1:value})", detail: "print output" },
    { label: "forin", insertText: "for ${1:item} in ${2:iterable}:\n\t${3:pass}", detail: "for-in loop" },
    { label: "tryexc", insertText: "try:\n\t${1:pass}\nexcept ${2:Exception} as e:\n\t${3:raise e}", detail: "try-except block" },
  ],
  cpp: [
    { label: "main", insertText: "int main() {\n\t${1:std::cout << \"Hello World\\n\";}\n\treturn 0;\n}", detail: "int main template" },
    { label: "cout", insertText: "std::cout << ${1:value} << std::endl;", detail: "cout stream output" },
    { label: "fori", insertText: "for (int i = 0; i < ${1:count}; ++i) {\n\t${2}\n}", detail: "for loop index" },
    { label: "include", insertText: "#include <${1:iostream}>", detail: "#include preprocessor" },
    { label: "vector", insertText: "std::vector<${1:type}> ${2:name};", detail: "vector declaration" },
  ],
  java: [
    { label: "main", insertText: "public static void main(String[] args) {\n\t${1}\n}", detail: "public static void main" },
    { label: "sysout", insertText: "System.out.println(${1:value});", detail: "System.out.println" },
    { label: "class", insertText: "public class ${1:ClassName} {\n\t${2}\n}", detail: "class structure template" },
    { label: "fori", insertText: "for (int i = 0; i < ${1:limit}; i++) {\n\t${2}\n}", detail: "standard for loop" },
  ],
  go: [
    { label: "main", insertText: "func main() {\n\t${1}\n}", detail: "main entry function" },
    { label: "fp", insertText: "fmt.Println(${1:value})", detail: "fmt.Println expression" },
    { label: "fn", insertText: "func ${1:name}(${2:params}) ${3:error} {\n\t${4}\n}", detail: "function template" },
    { label: "iferr", insertText: "if err != nil {\n\treturn ${1:err}\n}", detail: "check standard error" },
  ],
  rust: [
    { label: "main", insertText: "fn main() {\n\t${1}\n}", detail: "fn main entrypoint" },
    { label: "pln", insertText: "println!(\"${1}\");", detail: "println macro" },
    { label: "fn", insertText: "fn ${1:name}(${2:params}) -> ${3:Type} {\n\t${4}\n}", detail: "typed fn structure" },
    { label: "struct", insertText: "struct ${1:Name} {\n\t${2:field}: ${3:Type},\n}", detail: "struct definition" },
  ],
  html: [
    { label: "doc", insertText: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n\t<meta charset=\"UTF-8\">\n\t<title>${1:Document}</title>\n</head>\n<body>\n\t${2}\n</body>\n</html>", detail: "HTML5 Boilerplate" },
    { label: "div", insertText: "<div>\n\t${1}\n</div>", detail: "div element" },
    { label: "a", insertText: "<a href=\"${1:#}\">${2:link}</a>", detail: "anchor tag" },
  ],
  css: [
    { label: "flex", insertText: "display: flex;\njustify-content: ${1:center};\nalign-items: ${2:center};", detail: "flexbox center" },
    { label: "media", insertText: "@media (max-width: ${1:768}px) {\n\t${2}\n}", detail: "media query screen width" },
  ]
};

function EditorWorkspace({
  activeFile,
  isReadOnly,
  handleMount,
  onToggleSidebar,
  onExportWorkspace,
  roomId,
  currentUser,
  roomOwner,
  chatMessages,
  onSendMessage,
  onDeleteChatMessage,
  onMarkAllMessagesRead,
  onMarkSingleMessageRead,
  isChatOpen,
  onToggleChat,
  unreadChatCount,
}) {
  const editorRef = useRef(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [editorTheme, setEditorTheme] = useState(() => {
    return localStorage.getItem("collab_editor_theme") || "dark";
  });

  const toggleEditorTheme = () => {
    const nextTheme = editorTheme === "dark" ? "light" : "dark";
    setEditorTheme(nextTheme);
    localStorage.setItem("collab_editor_theme", nextTheme);
  };

  useEffect(() => {
    return () => {
      handleMount(null);
    };
  }, [handleMount]);

  const language = getLanguageFromFilename(activeFile);

  const handleEditorBeforeMount = (monaco) => {
    // Define VS Code Dark Plus theme with rich colors
    monaco.editor.defineTheme("vs-code-dark-plus", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "569cd6", fontStyle: "bold" },
        { token: "comment", foreground: "6a9955" },
        { token: "string", foreground: "ce9178" },
        { token: "number", foreground: "b5cea8" },
        { token: "regexp", foreground: "d16969" },
        { token: "type", foreground: "4ec9b0" },
        { token: "class", foreground: "4ec9b0" },
        { token: "function", foreground: "dcdcaa" },
        { token: "variable", foreground: "9cdcfe" },
        { token: "delimiter", foreground: "ffd700" },
      ],
      colors: {
        "editor.background": "#090d16",
        "editor.foreground": "#d4d4d4",
        "editorCursor.foreground": "#528bff",
        "editor.lineHighlightBackground": "#1e293b35",
        "editorLineNumber.foreground": "#858585",
        "editorLineNumber.activeForeground": "#c6c6c6",
      }
    });

    // Define VS Code Light Plus theme with rich colors
    monaco.editor.defineTheme("vs-code-light-plus", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "0000ff", fontStyle: "bold" },
        { token: "comment", foreground: "008000" },
        { token: "string", foreground: "a31515" },
        { token: "number", foreground: "098658" },
        { token: "regexp", foreground: "af00db" },
        { token: "type", foreground: "267f99" },
        { token: "class", foreground: "267f99" },
        { token: "function", foreground: "795e26" },
        { token: "variable", foreground: "001080" },
        { token: "delimiter", foreground: "0451a5" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#333333",
        "editorCursor.foreground": "#000000",
        "editor.lineHighlightBackground": "#f1f5f9",
        "editorLineNumber.foreground": "#a0a0a0",
        "editorLineNumber.activeForeground": "#4a4a4a",
      }
    });
  };

  const handleEditorMount = (editorInstance, monaco) => {
    editorRef.current = editorInstance;

    const preprocessStatements = (text, lang) => {
      let result = "";
      let inDoubleQuote = false;
      let inSingleQuote = false;
      let inBacktick = false;
      let inLineComment = false;
      let inBlockComment = false;
      let parenDepth = 0;
      let curlyDepth = 0;
      let squareDepth = 0;
      let currentLine = "";

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1] || "";
        const prevChar = text[i - 1] || "";
        const isEscaped = prevChar === "\\" && (text[i - 2] !== "\\");

        // Track comments
        if (!inDoubleQuote && !inSingleQuote && !inBacktick) {
          if (inLineComment) {
            if (char === "\n") {
              inLineComment = false;
            }
          } else if (inBlockComment) {
            if (char === "*" && nextChar === "/") {
              inBlockComment = false;
              result += "*/";
              currentLine += "*/";
              i++;
              continue;
            }
          } else {
            if (char === "/" && nextChar === "/") {
              inLineComment = true;
              result += "//";
              currentLine += "//";
              i++;
              continue;
            }
            if (char === "#" && (lang === "python" || lang === "plaintext" || lang === "markdown")) {
              inLineComment = true;
              result += "#";
              currentLine += "#";
              continue;
            }
            if (char === "/" && nextChar === "*") {
              inBlockComment = true;
              result += "/*";
              currentLine += "/*";
              i++;
              continue;
            }
          }
        }

        // Track strings
        if (!inLineComment && !inBlockComment) {
          if (char === '"' && !isEscaped && !inSingleQuote && !inBacktick) {
            inDoubleQuote = !inDoubleQuote;
          } else if (char === "'" && !isEscaped && !inDoubleQuote && !inBacktick) {
            inSingleQuote = !inSingleQuote;
          } else if (char === "`" && !isEscaped && !inDoubleQuote && !inSingleQuote) {
            inBacktick = !inBacktick;
          }
        }

        // Track brackets
        if (!inDoubleQuote && !inSingleQuote && !inBacktick && !inLineComment && !inBlockComment) {
          if (char === "(") parenDepth++;
          if (char === ")") parenDepth = Math.max(0, parenDepth - 1);
          if (char === "{") curlyDepth++;
          if (char === "}") curlyDepth = Math.max(0, curlyDepth - 1);
          if (char === "[") squareDepth++;
          if (char === "]") squareDepth = Math.max(0, squareDepth - 1);
        }

        // Split conditions
        if (!inDoubleQuote && !inSingleQuote && !inBacktick && !inLineComment && !inBlockComment) {
          // 1. C-like languages: '{', '}', ';'
          if (lang !== "python" && lang !== "plaintext" && lang !== "markdown") {
            if (char === "{") {
              result += "{\n";
              currentLine = "";
              continue;
            }
            if (char === "}") {
              if (!result.endsWith("\n")) {
                result += "\n";
              }
              result += "}\n";
              currentLine = "";
              continue;
            }
            if (char === ";" && parenDepth === 0) {
              result += ";\n";
              currentLine = "";
              continue;
            }
          }

          // 2. Python: block ':'
          if (lang === "python") {
            if (char === ":") {
              const trimmedLine = currentLine.trim();
              const blockKeywords = ["def", "class", "if", "elif", "else", "for", "while", "try", "except", "finally", "with"];
              const startsWithBlockKeyword = blockKeywords.some(kw =>
                trimmedLine === kw || trimmedLine.startsWith(kw + " ") || trimmedLine.startsWith(kw + "(") || trimmedLine.startsWith(kw + ":")
              );

              if (startsWithBlockKeyword && parenDepth === 0 && curlyDepth === 0 && squareDepth === 0) {
                result += ":\n";
                currentLine = "";
                continue;
              }
            }
          }
        }

        if (char === "\n") {
          currentLine = "";
        } else {
          currentLine += char;
        }
        result += char;
      }
      return result;
    };

    const smartFormatter = (text, language) => {
      const preprocessedText = preprocessStatements(text, language);
      const lines = preprocessedText.split("\n");
      let indentLevel = 0;
      const tab = "  "; // 2 spaces
      let shouldIndentNextPythonLine = false;
      let lastPythonIndent = "";

      const formattedLines = lines.map(line => {
        let trimmed = line.trim();
        if (!trimmed) return "";

        // Python formatting: preserve existing indentation but handle split lines
        if (language === "python") {
          const match = line.match(/^(\s*)/);
          const originalIndent = match ? match[0] : "";
          
          let indent = originalIndent;
          if (shouldIndentNextPythonLine) {
            indent = lastPythonIndent + tab;
            shouldIndentNextPythonLine = false;
          }

          const blockKeywords = ["def", "class", "if", "elif", "else", "for", "while", "try", "except", "finally", "with"];
          const startsWithBlockKeyword = blockKeywords.some(kw =>
            trimmed === kw || trimmed.startsWith(kw + " ") || trimmed.startsWith(kw + "(") || trimmed.startsWith(kw + ":")
          );

          if (trimmed.endsWith(":") && startsWithBlockKeyword) {
            shouldIndentNextPythonLine = true;
            lastPythonIndent = indent;
          }

          return indent + trimmed;
        }

        // C-like and other languages
        const startsWithCloseBrace = trimmed.startsWith("}") || trimmed.startsWith("]") || trimmed.startsWith(")");
        const startsWithCloseTag = trimmed.startsWith("</") || trimmed.startsWith("-->");

        if (startsWithCloseBrace || startsWithCloseTag) {
          indentLevel = Math.max(0, indentLevel - 1);
        }

        const indent = tab.repeat(indentLevel);

        const openBraces = (trimmed.split("{").length - 1) + (trimmed.split("[").length - 1) + (trimmed.split("(").length - 1);
        const closeBraces = (trimmed.split("}").length - 1) + (trimmed.split("]").length - 1) + (trimmed.split(")").length - 1);
        indentLevel += (openBraces - closeBraces);

        if (language === "html") {
          const openTags = (trimmed.match(/<[a-zA-Z0-9]+(?:\s+[^>]*[^/>])?>/g) || []).length;
          const closeTags = (trimmed.match(/<\/[a-zA-Z0-9]+>/g) || []).length;
          indentLevel += (openTags - closeTags);
        }

        indentLevel = Math.max(0, indentLevel);
        return indent + trimmed;
      });

      // Filter out extra adjacent empty lines to keep it neat
      const finalLines = [];
      for (let i = 0; i < formattedLines.length; i++) {
        if (formattedLines[i] === "" && finalLines[finalLines.length - 1] === "") {
          continue;
        }
        finalLines.push(formattedLines[i]);
      }
      return finalLines.join("\n").trim() + "\n";
    };

    if (!window.customFormatterRegistered) {
      window.customFormatterRegistered = true;
      // Only register simple custom formatter for languages without built-in Monaco formatters.
      // Monaco has excellent native formatters for: javascript, typescript, html, css, json.
      const simpleFormatLanguages = ["python", "cpp", "java", "go", "rust", "plaintext", "markdown"];
      simpleFormatLanguages.forEach(lang => {
        monaco.languages.registerDocumentFormattingEditProvider(lang, {
          provideDocumentFormattingEdits: (model) => {
            const formatted = smartFormatter(model.getValue(), lang);
            return [
              {
                range: model.getFullModelRange(),
                text: formatted,
              }
            ];
          }
        });
      });
    }

    // 2. Add Formatting Keyboard Shortcut commands (Alt+Shift+F & Cmd/Ctrl+Shift+F)
    editorInstance.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      editorInstance.trigger("keyboard", "editor.action.formatDocument", null);
    });
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      editorInstance.trigger("keyboard", "editor.action.formatDocument", null);
    });

    // Custom app shortcuts inside editor
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      onToggleSidebar();
    });
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onExportWorkspace();
    });

    // 3. Register custom autocomplete keyword / local buffer provider
    if (!window.customAutocompleteRegistered) {
      window.customAutocompleteRegistered = true;

      // Keywords & buffer variables
      Object.entries(LANGUAGE_KEYWORDS).forEach(([lang, keywords]) => {
        monaco.languages.registerCompletionItemProvider(lang, {
          provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            };

            const text = model.getValue();
            const typedWords = Array.from(new Set(text.match(/[a-zA-Z_]\w*/g) || []));

            const suggestions = [
              ...keywords.map((kw) => ({
                label: kw,
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: kw,
                range: range,
              })),
              ...typedWords
                .filter((w) => !keywords.includes(w) && w !== word.word && w.length > 2)
                .map((w) => ({
                  label: w,
                  kind: monaco.languages.CompletionItemKind.Variable,
                  insertText: w,
                  range: range,
                })),
            ];

            return { suggestions };
          },
        });
      });

      // Rich VS Code snippets
      Object.entries(LANGUAGE_SNIPPETS).forEach(([lang, snippets]) => {
        monaco.languages.registerCompletionItemProvider(lang, {
          provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            };

            return {
              suggestions: snippets.map((s) => ({
                label: s.label,
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: s.insertText,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: s.detail,
                range: range,
              })),
            };
          },
        });
      });
    }

    handleMount(editorInstance);
  };

  const handleFormatCode = () => {
    if (editorRef.current) {
      editorRef.current.trigger("source-code", "editor.action.formatDocument", null);
    }
  };

  const isDark = editorTheme === "dark";
  const mainBgClass = isDark ? "bg-[#090d16]" : "bg-[#f8fafc]";
  const borderClass = isDark ? "border-slate-900" : "border-slate-200/80";
  const headerBgClass = isDark ? "bg-slate-950/40" : "bg-white";
  const tabTextClass = isDark ? "text-slate-200" : "text-slate-700";
  const containerBgClass = isDark ? "bg-slate-950/50" : "bg-white";
  
  const formatBtnClass = isReadOnly
    ? (isDark ? "bg-slate-900/10 border-slate-800/20 text-slate-600 cursor-not-allowed" : "bg-slate-100/50 border-slate-200/30 text-slate-300 cursor-not-allowed")
    : (isDark ? "bg-slate-900/40 border-slate-800/40 hover:bg-slate-800 text-slate-305 hover:text-slate-100" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900");
    
  const actionBtnClass = isDark
    ? "bg-slate-900/40 border-slate-800/40 hover:bg-slate-805 text-slate-305 hover:text-slate-100"
    : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900";
    
  const languageTagClass = isDark ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500";
  const noFileCardBgClass = isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200";
  const noFileHeaderClass = isDark ? "text-slate-200" : "text-slate-700";
  const noFileTextClass = isDark ? "text-slate-500" : "text-slate-400";

  return (
    <div className="flex-1 h-full flex overflow-hidden">
      <main className={`flex-1 h-full p-4 flex flex-col overflow-hidden select-none transition-colors duration-200 ${mainBgClass}`}>
        {/* Read-Only Warning Banner */}
        {isReadOnly && activeFile && (
          <div className="mb-3 px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Your typing permissions have been locked by the Admin. You are in read-only mode.
          </div>
        )}

        {/* Editor Tab Header */}
        <div className={`flex items-center justify-between px-4 py-3 border border-b-0 rounded-t-2xl transition-colors duration-200 ${headerBgClass} ${borderClass}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {activeFile ? getFileIcon(activeFile) : (
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            )}
            <span className={`text-sm font-semibold truncate max-w-[100px] sm:max-w-[250px] transition-colors duration-200 ${tabTextClass}`} title={activeFile || "Workspace Lobby"}>
              {activeFile || "Workspace Lobby"}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            {activeFile && (
              <button
                onClick={handleFormatCode}
                disabled={isReadOnly}
                className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${formatBtnClass}`}
                title="Format Code"
              >
                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                </svg>
                <span className="hidden sm:inline">Format Code</span>
              </button>
            )}

            {/* Light / Dark Mode Toggle Button */}
            <button
              onClick={toggleEditorTheme}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${actionBtnClass}`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.072.072a5 5 0 01-7 0z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              <span className="hidden sm:inline">{isDark ? "Light Mode" : "Dark Mode"}</span>
            </button>

            <button
              onClick={onToggleChat}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer relative ${
                isChatOpen
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : actionBtnClass
              }`}
              title="Toggle Lobby Chat"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="hidden sm:inline">Lobby Chat</span>
              {!isChatOpen && unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white animate-bounce">
                  {unreadChatCount}
                </span>
              )}
            </button>

            {/* Keyboard Shortcuts Button (Hidden on small screens, shown only on large screens) */}
            <button
              onClick={() => setShowShortcuts(true)}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg border transition cursor-pointer hidden md:flex items-center gap-1.5 ${actionBtnClass}`}
              title="View Keyboard Shortcuts"
            >
              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="hidden sm:inline">Shortcuts</span>
            </button>
            
            {activeFile && (
              <span className={`px-2 py-1 rounded border text-[10px] uppercase font-bold tracking-wider hidden sm:inline-block transition-colors duration-200 ${languageTagClass}`}>
                {language}
              </span>
            )}
          </div>
        </div>

        {/* Editor Container or No File Open Banner */}
        <div className={`flex-1 w-full rounded-b-2xl border border-t-0 overflow-hidden shadow-2xl relative transition-colors duration-200 ${containerBgClass} ${borderClass}`}>
          {!activeFile ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 select-none px-6 text-center">
              <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center text-slate-500 mb-4 shadow-xl transition-colors duration-200 ${noFileCardBgClass}`}>
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className={`font-bold text-sm transition-colors duration-200 ${noFileHeaderClass}`}>No File Open</h3>
              <p className={`text-xs mt-2 leading-relaxed max-w-sm transition-colors duration-200 ${noFileTextClass}`}>
                Create a new file or select an existing file from the explorer in the sidebar to start collaborating in real-time.
              </p>
            </div>
          ) : (
            <Editor
              height="100%"
              language={language}
              theme={isDark ? "vs-code-dark-plus" : "vs-code-light-plus"}
              beforeMount={handleEditorBeforeMount}
              onMount={handleEditorMount}
              options={{
                readOnly: isReadOnly,
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', var(--font-mono), monospace",
                lineHeight: 22,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                padding: { top: 16, bottom: 16 },
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                  vertical: "visible",
                  horizontal: "visible",
                },
                roundedSelection: true,
                selectOnLineNumbers: true,
                automaticLayout: true,
                tabSize: 2,

                // Rich Autocomplete & IntelliSense Configurations
                quickSuggestions: {
                  other: true,
                  comments: false,
                  strings: false,
                },
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: "on",
                tabCompletion: "on",
                wordBasedSuggestions: "allDocuments",
                snippetSuggestions: "inline",
                formatOnType: true,
                formatOnPaste: true,
                suggest: {
                  showFields: true,
                  showFunctions: true,
                  showMethods: true,
                  showVariables: true,
                  showWords: true,
                  showModules: true,
                  showClasses: true,
                  showInterfaces: true,
                  showConstructors: true,
                  showProperties: true,
                  showEvents: true,
                  showOperators: true,
                  showKeywords: true,
                  showSnippets: true,
                },
              }}
            />
          )}
        </div>

        {/* Shortcuts Cheat Sheet Modal */}
        {showShortcuts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    VS Code & App Shortcuts
                  </h3>
                  <button 
                    onClick={() => setShowShortcuts(false)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">App Commands</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-350">Toggle Sidebar</span>
                        <kbd className="px-2 py-1 rounded bg-slate-950 border border-slate-850 text-slate-200 font-mono font-bold shadow">Ctrl/Cmd + B</kbd>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-350">Save / Export Workspace</span>
                        <kbd className="px-2 py-1 rounded bg-slate-950 border border-slate-850 text-slate-200 font-mono font-bold shadow">Ctrl/Cmd + S</kbd>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 pt-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Editor Controls</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-350">Format Document</span>
                        <kbd className="px-2 py-1 rounded bg-slate-950 border border-slate-850 text-slate-200 font-mono font-bold shadow">Shift + Alt + F</kbd>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-350">Toggle Line Comment</span>
                        <kbd className="px-2 py-1 rounded bg-slate-950 border border-slate-850 text-slate-200 font-mono font-bold shadow">Ctrl/Cmd + /</kbd>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-350">Find</span>
                        <kbd className="px-2 py-1 rounded bg-slate-950 border border-slate-850 text-slate-200 font-mono font-bold shadow">Ctrl/Cmd + F</kbd>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-350">Replace</span>
                        <kbd className="px-2 py-1 rounded bg-slate-950 border border-slate-850 text-slate-200 font-mono font-bold shadow">Ctrl/Cmd + H</kbd>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-350">Move Line Up / Down</span>
                        <kbd className="px-2 py-1 rounded bg-slate-950 border border-slate-850 text-slate-200 font-mono font-bold shadow">Alt + Up/Down</kbd>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-350">Copy Line Up / Down</span>
                        <kbd className="px-2 py-1 rounded bg-slate-950 border border-slate-850 text-slate-200 font-mono font-bold shadow">Shift + Alt + Up/Down</kbd>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-350">Add Cursor Above / Below</span>
                        <kbd className="px-2 py-1 rounded bg-slate-950 border border-slate-850 text-slate-200 font-mono font-bold shadow">Ctrl+Alt / Cmd+Opt + Up/Down</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-3.5 bg-slate-950/50 border-t border-slate-900 flex justify-end">
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition active:scale-95 cursor-pointer"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <ChatPanel
        roomId={roomId}
        currentUser={currentUser}
        roomOwner={roomOwner}
        messages={chatMessages}
        onSendMessage={onSendMessage}
        onDeleteMessage={onDeleteChatMessage}
        onMarkAllRead={onMarkAllMessagesRead}
        onMarkRead={onMarkSingleMessageRead}
        isOpen={isChatOpen}
        onToggleOpen={onToggleChat}
      />
    </div>
  );
}

EditorWorkspace.propTypes = {
  activeFile: PropTypes.string,
  isReadOnly: PropTypes.bool.isRequired,
  handleMount: PropTypes.func.isRequired,
  onToggleSidebar: PropTypes.func.isRequired,
  onExportWorkspace: PropTypes.func.isRequired,
  roomId: PropTypes.string.isRequired,
  currentUser: PropTypes.string.isRequired,
  roomOwner: PropTypes.string,
  chatMessages: PropTypes.array.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onDeleteChatMessage: PropTypes.func.isRequired,
  onMarkAllMessagesRead: PropTypes.func.isRequired,
  onMarkSingleMessageRead: PropTypes.func.isRequired,
  isChatOpen: PropTypes.bool.isRequired,
  onToggleChat: PropTypes.func.isRequired,
  unreadChatCount: PropTypes.number.isRequired,
};

export default EditorWorkspace;
