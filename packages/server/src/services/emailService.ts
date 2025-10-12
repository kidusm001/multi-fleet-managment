import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));


export function interpolateEmailTemplate (html: string, data: Record<string, string>) : string {
    const regex = /\{\{(\w+)\}\}/g;
    return html.replace(regex, (match: string, key: string) => {
        const value = data[key];
        return value !== undefined ? String(value) : match;
    })
}

export async function loadAndInterpolateTemplate(
    templateFileName: string,
    data: Record<string, string>
): Promise<string> {
    const templatePath = join(__dirname, '..', '..', 'templates', templateFileName);
    const htmlTemplate = await readFile(templatePath, 'utf-8');
    return interpolateEmailTemplate(htmlTemplate, data);
}
