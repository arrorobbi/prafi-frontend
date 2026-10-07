/** Case-insensitive "contains", for the public search boxes. */
export const matches = (text: string, q: string) => text.toLowerCase().includes(q.toLowerCase());
