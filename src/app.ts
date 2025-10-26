import knex, { migrate, seed } from "#postgres/knex.js";
import WBService from "#utils/WBService.js";
import { getCurrentDate, sleep } from "#utils/common.js";
import { StocksCoefs } from "knex/types/tables.js";
import {
    columnTitle,
    insertToTable,
    StocksCoefsServiceKeyToDB,
    TableStocksCoefs,
    updateToTable,
} from "#postgres/tables/StocksCoefs.js";
import GoogleSheetsService from "#utils/googleSheetsService.js";

await migrate.latest();
await seed.run();

const wbService = new WBService();
let firstLaunch = true;
const sheetsService = new GoogleSheetsService();
console.log("All migrations and seeds have been run");

async function loopUpdateSheets() {
    //Получаем список из сервиса WB
    const currentDate = getCurrentDate();
    const listWarehouse = await wbService.getTariffsBox(currentDate);

    //Получаем список данных из БД на текущий день
    const allCurrentDayData = await knex<StocksCoefs>('stocks_coefs').where('date', currentDate);
    const allDataMap = new Map(allCurrentDayData.map(item => [item.house_name, item]));

    //Записываем данные в БД
    const insertData = [];
    const updateData = [];

    //Проверяем, есть ли на текущую дату записи.
    for (const warehouse of listWarehouse) {
        const newDataObject: Record<string, any> = {
            date: currentDate,
            house_name: warehouse.warehouseName,
        }
        const dictionary = Object.entries(StocksCoefsServiceKeyToDB);
        for (const [propName, dbName] of dictionary) {
            const value = (warehouse as Record<string, any>)[propName];
            newDataObject[dbName] = value === '-' ? null : value.replace(',', '.');
        }

        //Если нет, то добавляем
        if (allDataMap.has(warehouse.warehouseName)) {
            updateData.push(newDataObject);
        } else {//Если есть, то обновляем
            insertData.push(newDataObject);
        }
    }

    if (insertData.length > 0) {
        await insertToTable(TableStocksCoefs, insertData);
    }

    if (updateData.length > 0) {
        await updateToTable(TableStocksCoefs, updateData, ['date', 'house_name']);
    }

    //Записываем данные в Google Sheets
    if (firstLaunch) {
        firstLaunch = false;
        const titleColumn = columnTitle.map((i) => i.name);
        await sheetsService.createNewSheet('stocks_coefs');
        await sheetsService.writeData('stocks_coefs!A1', [titleColumn])
    }

    const currentDataMap = new Map(listWarehouse.map(item => [item.warehouseName, item]));
    const firstRowIndex = await sheetsService.findFirstMatch('stocks_coefs', 0, currentDate);
    const currentIndex = firstRowIndex === -1 ? 2 : firstRowIndex;
    const newData: any[][] = [];
    for (const [key, value] of [...currentDataMap.entries()]) {
        //Находим самую первую строку в которой упоминаются текущая дата
        const row = [];
        const rowValue = value as Record<string, any>;
        row.push(currentDate);

        for (const column of columnTitle) {
            if (rowValue[column.code]) {
                row.push(rowValue[column.code]);
            }
        }

        newData.push(row);
    }

    if (newData.length > 0) {
        await sheetsService.writeData(`stocks_coefs!A${currentIndex}`, newData);
        await sheetsService.sortByMultipleColumns('stocks_coefs', [
            {columnIndex: 0, sortOrder: "ASCENDING"},
            {columnIndex: 3, sortOrder: "ASCENDING"},
            {columnIndex: 6, sortOrder: "ASCENDING"},
            {columnIndex: 9, sortOrder: "ASCENDING"},
        ])
    }
}

loopUpdateSheets().catch(console.error);

setInterval(() => loopUpdateSheets().catch(console.error), 60 * 1000);