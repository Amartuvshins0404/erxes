export interface MessagePairItem {
  _id: string;
  role: string;
}

/**
 * Resolve a user prompt and its assistant reply from an ordered transcript.
 * The selected id may belong to either side of the pair so a just-finished
 * client turn can delete by its reconciled assistant id before the user row's
 * native id is known.
 */
export const findMessagePairIds = (
  messages: readonly MessagePairItem[],
  selectedId: string,
): string[] | null => {
  const selectedIndex = messages.findIndex(({ _id }) => _id === selectedId);
  if (selectedIndex < 0) return null;

  let userIndex = selectedIndex;
  if (messages[selectedIndex].role === 'assistant') {
    userIndex = -1;
    for (let index = selectedIndex - 1; index >= 0; index -= 1) {
      if (messages[index].role === 'user') {
        userIndex = index;
        break;
      }
    }
  }
  if (userIndex < 0 || messages[userIndex].role !== 'user') return null;

  const deletedIds = [messages[userIndex]._id];
  for (let index = userIndex + 1; index < messages.length; index += 1) {
    if (messages[index].role === 'user') break;
    if (messages[index].role === 'assistant') {
      deletedIds.push(messages[index]._id);
      break;
    }
  }
  return deletedIds;
};
