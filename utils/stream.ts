export function splitTextByPunctuation(text: string): string[] {
    if (!text) return [];

    // Regular expression to split text by common punctuation marks
    // including English and Chinese punctuations
    const regex = /([^.,?!，。？！\n]+[.,?!，。？！\n]*)/g;
    const matches = text.match(regex);

    if (!matches) {
        return [text.trim()];
    }

    return matches.map(m => m.trim()).filter(m => m.length > 0);
}
