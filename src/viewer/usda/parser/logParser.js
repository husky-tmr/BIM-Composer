// src/viewer/usda/parser/logParser.js
export function parseStatementLog(statementContent) {
  console.log("[LOG_PARSER] Parsing statement log...");
  console.log("[LOG_PARSER] Content length:", statementContent?.length || 0);

  const commits = new Map();
  const roots = [];
  const logRegex = /def "Log_([^"]+)"\s*{([^]*?)}/g;
  let match;
  let matchCount = 0;

  while ((match = logRegex.exec(statementContent)) !== null) {
    matchCount++;
    const logId = match[1];
    const logContent = match[2];
    console.log(`[LOG_PARSER] Found log: ${logId}`);

    const commit = { id: logId };

    const entryMatch = logContent.match(/custom int entry = (\d+)/);
    if (entryMatch) commit.entry = parseInt(entryMatch[1], 10);

    const typeMatch = logContent.match(/custom string type = "([^"]+)"/);
    if (typeMatch) commit.type = typeMatch[1];

    const parentMatch = logContent.match(/custom string parent = "([^"]+)"/);
    if (parentMatch) {
      commit.parent = parentMatch[1];
    } else {
      commit.parent = null;
    }

    const stagedPrimsMatch = logContent.match(
      /custom string\[] stagedPrims = \[([^\]]*)\]/
    );
    if (stagedPrimsMatch) {
      commit.stagedPrims = stagedPrimsMatch[1]
        .split(",")
        .map((p) => p.trim().replace(/"/g, ""));
    } else {
      commit.stagedPrims = [];
    }

    const historyStatusMatch = logContent.match(
      /custom string sourceStatusForHistory = "([^"]+)"/
    );
    const sourceStatusMatch = logContent.match(
      /custom string sourceStatus = "([^"]+)"/
    );

    if (commit.type === "Promotion" && historyStatusMatch) {
      commit.sourceStatus = historyStatusMatch[1];
    } else if (sourceStatusMatch) {
      commit.sourceStatus = sourceStatusMatch[1];
    }

    commits.set(logId, commit);
  }

  console.log(`[LOG_PARSER] Total matches found: ${matchCount}`);
  console.log(`[LOG_PARSER] Commits parsed: ${commits.size}`);

  commits.forEach((commit, id) => {
    if (!commit.parent || !commits.has(commit.parent)) {
      roots.push(id);
    }
  });

  console.log(`[LOG_PARSER] Root commits: ${roots.length}`);
  return { commits: commits, roots: roots };
}
