import { parse } from 'csv-parse/sync';
import { RawImportRow } from '../types/raw-import-row.type';

export function parseImportFile(buffer: Buffer, mimetype: string): RawImportRow[] {
    const isJson = mimetype.includes('json');

    if (isJson) {
        const parsed = JSON.parse(buffer.toString('utf-8'));
        if (!Array.isArray(parsed)) {
            throw new Error('JSON file must contain an array of records');
        }
        return parsed;
    }

    return parse(buffer.toString('utf-8'), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });
}