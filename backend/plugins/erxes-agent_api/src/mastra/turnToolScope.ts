const STANDALONE_TOOL_NAMES: Record<string, true> = {
  webSearch: true,
  fetchUrl: true,
  calculator: true,
  renderChart: true,
  renderDiagram: true,
  generatePdf: true,
  generateDocx: true,
  generateXlsx: true,
  generatePptx: true,
  removeImageBackground: true,
  terminal: true,
  workspaceWrite: true,
  publishWebsite: true,
  fileReader: true,
  workflowGuide: true,
  workflowValidate: true,
  workflowSimulate: true,
  workflowSave: true,
  workflowUpdate: true,
  workflowList: true,
  workflowRuns: true,
  workflowRunNow: true,
  list_config_keys: true,
  make_skill: true,
};

const SKILL_TOOLS = ['skill', 'skill_search', 'skill_read'] as const;

export interface TurnToolScopeInput {
  message: string;
  attachmentCount: number;
  availableToolNames: string[];
  hasErxesOperations?: boolean;
  hasIntentOperation?: boolean;
  skillsEnabled?: boolean;
}

/**
 * Keep permission-approved erxes operations available to ToolSearchProcessor,
 * but expose standalone builtins only when this turn's request needs them.
 */
export function selectTurnActiveTools({
  message,
  attachmentCount,
  availableToolNames,
  hasErxesOperations = false,
  hasIntentOperation = false,
  skillsEnabled = false,
}: TurnToolScopeInput): string[] {
  const request = message.toLowerCase();
  const wantsPresentation =
    /\b(?:power\s*point|pptx|presentation|pitch deck|slide deck|slides?|deck)\b|танилцуул/.test(
      request,
    );
  const wantsSpreadsheet =
    /\b(?:excel|xlsx|spreadsheet|workbook)\b|хүснэгт/.test(request);
  const wantsWordDocument =
    /\b(?:word|docx|editable (?:document|proposal|file))\b/.test(request);
  const wantsPdf = /\bpdf\b/.test(request);
  const wantsGenericReport = /\b(?:formatted )?report\b|тайлан/.test(request);
  const active = new Set(
    availableToolNames.filter((name) => !STANDALONE_TOOL_NAMES[name]),
  );
  const activate = (name: string) => {
    if (availableToolNames.includes(name)) active.add(name);
  };

  if (
    attachmentCount > 0 ||
    /\b(?:read|open|inspect|review|import|upload|use|process)\b[^.!?\n]{0,40}\b(?:file|attachment|csv|xlsx?|docx?|pdf|pptx?)\b|файл|хавсралт/.test(
      request,
    )
  ) {
    activate('fileReader');
  }

  if (wantsPresentation) {
    activate('generatePptx');
  }
  if (wantsSpreadsheet) {
    activate('generateXlsx');
  }
  if (wantsWordDocument) {
    activate('generateDocx');
  }
  if (
    wantsPdf ||
    (wantsGenericReport &&
      !wantsPresentation &&
      !wantsSpreadsheet &&
      !wantsWordDocument)
  ) {
    activate('generatePdf');
  }

  if (/\b(?:chart|graph|plot|visuali[sz]e)\b|график/.test(request)) {
    activate('renderChart');
  }
  if (
    /\b(?:diagram|flowchart|architecture map|sequence diagram)\b|диаграм/.test(
      request,
    )
  ) {
    activate('renderDiagram');
  }
  if (
    /\b(?:calculate|calculator|forecast|percentage|monte carlo|break-even)\b|тооц|прогноз|таамаг/.test(
      request,
    )
  ) {
    activate('calculator');
  }

  if (
    /\b(?:web search|search the web|look up|find online|internet|online sources?|latest news|research online|current (?:exchange )?rate)\b|интернет|вэбээс|судалгаа/.test(
      request,
    ) ||
    /https?:\/\//.test(request)
  ) {
    activate('webSearch');
    activate('fetchUrl');
  }

  if (
    /\b(?:config|configuration|setting|secret|api key)\b|тохиргоо/.test(request)
  ) {
    activate('list_config_keys');
  }
  if (
    /\b(?:website|landing page|web page|static site)\b|вэбсайт|сайт/.test(
      request,
    )
  ) {
    activate('terminal');
    activate('workspaceWrite');
    activate('publishWebsite');
  }
  if (
    /\b(?:remove|delete) (?:the )?(?:image |photo )?background\b|transparent background/.test(
      request,
    )
  ) {
    activate('removeImageBackground');
  }

  if (
    /\b(?:workflow|automation|automate|scheduled flow)\b|автоматжуул/.test(
      request,
    )
  ) {
    for (const name of [
      'workflowGuide',
      'workflowValidate',
      'workflowSimulate',
      'workflowSave',
      'workflowUpdate',
      'workflowList',
      'workflowRuns',
      'workflowRunNow',
    ]) {
      activate(name);
    }
  }
  if (/\b(?:create|make|save|publish) (?:a )?skill\b/.test(request)) {
    activate('make_skill');
  }

  const hasSelectedStandalone = availableToolNames.some(
    (name) => STANDALONE_TOOL_NAMES[name] && active.has(name),
  );
  const isSmallTalk =
    /^(?:hi|hello|hey|thanks|thank you|bye|good (?:morning|afternoon|evening)|sain uu|сайн уу)[.!?]*$/i.test(
      request.trim(),
    );
  if (!hasSelectedStandalone && !hasIntentOperation && !isSmallTalk) {
    // Keyword scoping is an optimization, never an authority boundary. When
    // intent is ambiguous and no exact erxes operation matched, preserve every
    // permission-approved standalone capability rather than silently hiding a
    // valid tool because the user chose an unlisted synonym or language.
    for (const name of availableToolNames) {
      if (STANDALONE_TOOL_NAMES[name]) active.add(name);
    }
  }

  if (hasErxesOperations) active.add('search_tools');
  if (skillsEnabled) {
    for (const name of SKILL_TOOLS) active.add(name);
  }
  return [...active];
}
