import { ToolSearchProcessor } from '@mastra/core/processors';
import type { ProcessInputStepArgs } from '@mastra/core/processors';

// ToolSearchProcessor (autoLoad mode) tells the model that searched tools
// become available "on your next turn". That is factually wrong: the loaded
// tools are injected into the very NEXT STEP of the same run, and the agentic
// loop ends the run when the model answers with text instead of calling them.
// Models read "next turn" as "after the user replies", narrate what they would
// do, and stop. This subclass corrects the mechanism wording everywhere Mastra
// emits it — the injected system line, the search_tools description, and the
// tool result message — so the explanation matches how loading actually works.
const MISLEADING_AVAILABILITY = /on your next turn/g;
const ACTUAL_AVAILABILITY = 'on your next step';

function correctAvailabilityWording(text: string): string {
  return text.replace(MISLEADING_AVAILABILITY, ACTUAL_AVAILABILITY);
}

type AddSystemMessage = Parameters<
  ProcessInputStepArgs['messageList']['addSystem']
>[0];

function correctSystemMessage(message: AddSystemMessage): AddSystemMessage {
  if (typeof message === 'string') {
    return correctAvailabilityWording(message);
  }
  if (Array.isArray(message)) {
    return message.map((entry) =>
      typeof entry === 'string' ? correctAvailabilityWording(entry) : entry,
    ) as AddSystemMessage;
  }
  if (
    message &&
    typeof message === 'object' &&
    typeof (message as { content?: unknown }).content === 'string'
  ) {
    const record = message as { content: string };
    return {
      ...record,
      content: correctAvailabilityWording(record.content),
    } as AddSystemMessage;
  }
  return message;
}

type SearchStepResult = Awaited<
  ReturnType<ToolSearchProcessor['processInputStep']>
>;

export class ErxesToolSearchProcessor extends ToolSearchProcessor {
  async processInputStep(
    args: ProcessInputStepArgs,
  ): Promise<SearchStepResult> {
    const { messageList } = args;
    const addSystem = messageList.addSystem.bind(messageList);
    messageList.addSystem = ((message: AddSystemMessage, tag?: string) =>
      addSystem(correctSystemMessage(message), tag)
    ) as typeof messageList.addSystem;

    try {
      const result = await super.processInputStep(args);
      const searchTool = result.tools.search_tools;
      if (searchTool) {
        searchTool.description = correctAvailabilityWording(
          searchTool.description,
        );
        const execute = searchTool.execute?.bind(searchTool);
        if (execute) {
          searchTool.execute = async (inputData, context) => {
            const output = await execute(inputData, context);
            if (
              output &&
              typeof output === 'object' &&
              typeof (output as { message?: unknown }).message === 'string'
            ) {
              const record = output as { message: string };
              record.message = correctAvailabilityWording(record.message);
            }
            return output;
          };
        }
      }
      return result;
    } finally {
      messageList.addSystem = addSystem;
    }
  }
}
