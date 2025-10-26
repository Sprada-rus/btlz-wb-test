import { google } from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config();

interface SortSpec {
    columnIndex: number;
    sortOrder: 'ASCENDING' | 'DESCENDING';
}

export default class GoogleSheetsService {
    private sheets;
    private spreadsheetId: string;
    private sheetLists: any[] = [];

    constructor() {
        // Авторизация с помощью service account
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.G_EMAIL,
                private_key: process.env.G_SECRET_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
        this.spreadsheetId = process.env.G_SHEET_ID || '';
    }

    async writeData(range: string, values: any[][]): Promise<void> {
        try {
            const response = await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range,
                valueInputOption: 'RAW',
                requestBody: {
                    values,
                },
            });

            console.log('Данные успешно записаны:', response.data);
        } catch (error) {
            console.error('Ошибка при записи данных:', error);
            throw error;
        }
    }

    async renameTableHead(listName: string, values: string[]) {
        try {
            await this.writeData(listName+'!A1', [values]);
        } catch (error) {
            console.error('Ошибка при изменении заголовка таблицы:', error);
            throw error;
        }
    }

    async appendData(range: string, values: any[][]): Promise<void> {
        try {
            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values,
                },
            });

            console.log('Данные успешно добавлены:', response.data);
        } catch (error) {
            console.error('Ошибка при добавлении данных:', error);
            throw error;
        }
    }

    async readData(range: string): Promise<any[][]> {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range,
            });

            return response.data.values || [];
        } catch (error) {
            console.error('Ошибка при чтении данных:', error);
            throw error;
        }
    }

    async createNewSheet(sheetTitle: string): Promise<boolean> {
        try {
            if (await this.sheetExists(sheetTitle)) {
                console.log(`✅ Лист "${sheetTitle}" был ранее создан`);
                return false;
            }

            const request = {
                spreadsheetId: this.spreadsheetId,
                resource: {
                    requests: [
                        {
                            addSheet: {
                                properties: {
                                    title: sheetTitle,
                                    // Дополнительные свойства листа
                                    index: 0, // позиция (0 - первый лист)
                                    gridProperties: {
                                        rowCount: 1000, // количество строк
                                        columnCount: 26, // количество колонок
                                        frozenRowCount: 1 // замороженные строки (для заголовков)
                                    },
                                    tabColor: {
                                        red: 0.0,
                                        green: 0.5,
                                        blue: 1.0
                                    }
                                }
                            }
                        }
                    ]
                }
            };

            const response = await this.sheets.spreadsheets.batchUpdate(request);
            console.log(`✅ Лист "${sheetTitle}" успешно создан`);
            console.log('ID нового листа:', response.data.replies?.[0]?.addSheet?.properties?.sheetId);
            return true;
        } catch (error) {
            console.error('❌ Ошибка при создании листа:', error);
            throw error;
        }
    }

    async renameSheet(
        oldSheetName: string,
        newSheetName: string
    ): Promise<boolean> {
        try {
            // Получаем ID листа по названию
            const sheetId = await this.getSheetId(oldSheetName);

            // Проверяем, не существует ли уже лист с таким названием
            if (await this.sheetExists(oldSheetName)) {
                console.log(`✅ Лист с именем "${newSheetName}" уже есть.`);
                return true;
            }

            const request = {
                spreadsheetId: this.spreadsheetId,
                resource: {
                    requests: [
                        {
                            updateSheetProperties: {
                                properties: {
                                    sheetId: sheetId,
                                    title: newSheetName
                                },
                                fields: 'title'
                            }
                        }
                    ]
                }
            };

            await this.sheets.spreadsheets.batchUpdate(request);

            console.log(`✅ Лист "${oldSheetName}" переименован в "${newSheetName}"`);

            return true;

        } catch (error) {
            console.error(`❌ Ошибка при переименовании листа "${oldSheetName}":`, error);

            return false;
        }
    }

    async getSheetsList(): Promise<Array<{ title: string; sheetId: number }>> {
        try {
            if (this.sheetLists.length > 0) return this.sheetLists;

            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });
            const sheets = response.data.sheets?.map(sheet => ({
                title: sheet.properties?.title || '',
                sheetId: sheet.properties?.sheetId || 0
            })) || [];

            this.sheetLists = sheets;
            setTimeout(() => this.sheetLists = [], 5 * 60 * 1000);

            return sheets;
        } catch (error) {
            console.error('❌ Ошибка при получении списка листов:', error);
            throw error;
        }
    }

    async sheetExists(sheetTitle: string): Promise<boolean> {
        const sheets = await this.getSheetsList();
        return sheets.some(sheet => sheet.title === sheetTitle);
    }

    private async getSheetId(sheetName: string): Promise<number> {
        const response = await this.sheets.spreadsheets.get({
            spreadsheetId: this.spreadsheetId
        });

        const sheet = response.data.sheets?.find(
            s => s.properties?.title === sheetName
        );

        if (!sheet) {
            throw new Error(`"${sheetName}" не найден`);
        }

        return sheet.properties?.sheetId || 0;
    }

    async sortByMultipleColumns(
        sheetName: string,
        sortSpecs: SortSpec[],
        options: {
            startRow?: number;    // начальная строка (по умолчанию 1 - пропускаем заголовки)
            endRow?: number;      // конечная строка
            startCol?: number;    // начальная колонка
            endCol?: number;      // конечная колонка
        } = {}
    ): Promise<void> {
        try {
            const sheetId = await this.getSheetId(sheetName);

            const request = {
                spreadsheetId: this.spreadsheetId,
                resource: {
                    requests: [
                        {
                            sortRange: {
                                range: {
                                    sheetId: sheetId,
                                    startRowIndex: options.startRow || 1, // пропускаем заголовки
                                    endRowIndex: options.endRow || 100000,
                                    startColumnIndex: options.startCol || 0,
                                    endColumnIndex: options.endCol || 26
                                },
                                sortSpecs: sortSpecs.map(spec => ({
                                    dimensionIndex: spec.columnIndex,
                                    sortOrder: spec.sortOrder
                                }))
                            }
                        }
                    ]
                }
            };

            await this.sheets.spreadsheets.batchUpdate(request);

            const sortDescription = sortSpecs.map(spec =>
                `колонка ${spec.columnIndex} (${spec.sortOrder})`
            ).join(', ');

            console.log(`✅ Таблица "${sheetName}" отсортирована по: ${sortDescription}`);

        } catch (error) {
            console.error('❌ Ошибка при сортировке:', error);
            throw error;
        }
    }

    async findFirstMatch(listName: string, columnIndex: number, searchValue: string): Promise<number> {
        const allList = await this.readData(listName+'!A2');
        let rowIndex = -1;

        for (const row of allList) {
            if (row[columnIndex] === searchValue) {
                rowIndex = rowIndex + 3;
                break;
            }
        }

        return rowIndex;
    }
}

