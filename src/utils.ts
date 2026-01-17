export async function parseError(err: unknown) {
    if (!err) return null;
    const error = err as Response;
    if (error.body) {
        const data = await error.body.getReader().read();
        return JSON.parse(new TextDecoder("utf-8").decode(data.value));
    }
}
