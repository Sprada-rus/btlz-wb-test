import knex from "#postgres/knex.js";;
import { StocksCoefs } from "knex/types/tables.js";

declare module 'knex/types/tables.js' {
    interface StocksCoefs {
        stock_id: number,
        date: string,
        house_name: string,
        delivery_base: number|null,
        delivery_coef_expr: number|null,
        delivery_liter: number|null,
        market_base: number|null,
        market_coef_expr: number|null,
        market_liter: number|null,
        storage_base: number|null,
        storage_coef_expr: number|null,
        storage_liter: number|null,
    }
}

export const TableStocksCoefs = 'stocks_coefs'

export async function insertToTable(tableName: string, tableData: Record<string, any>[]) {
    try {
        const lastId = (await knex(TableStocksCoefs).orderBy('stock_id', 'desc').first()).stock_id;
        console.log('lastId', lastId);
        let nextId = lastId + 1;
        for (const data of tableData) {
            data.stock_id = nextId++;
        }
        await knex(TableStocksCoefs).insert(tableData);
        console.log('Данные успешно добавлены');
    } catch (error) {
        console.error(`Ошибка при записи данных в таблицу ${tableName}`, error);
    }
}

export const StocksCoefsServiceKeyToDB = {
    boxDeliveryBase: 'delivery_base',
    boxDeliveryCoefExpr: 'delivery_coef_expr',
    boxDeliveryLiter: 'delivery_liter',
    boxDeliveryMarketplaceBase: 'market_base',
    boxDeliveryMarketplaceCoefExpr: 'market_coef_expr',
    boxDeliveryMarketplaceLiter: 'market_liter',
    boxStorageBase: 'storage_base',
    boxStorageCoefExpr: 'storage_coef_expr',
    boxStorageLiter: 'storage_liter'
}

export const columnTitle = [
    { name: "Дата", code: 'data'},
    { name: "Название склада", code: 'warehouseName'},
    { name: "Логистика, первый литр, ₽", code: 'boxDeliveryBase'},
    { name: 'Коэффициент Логистика, %', code: 'boxDeliveryCoefExpr'},
    { name: 'Логистика, дополнительный литр, ₽', code: 'boxDeliveryLiter'},
    { name: 'Логистика FBS, первый литр, ₽', code: 'boxDeliveryMarketplaceBase'},
    { name: 'Коэффициент FBS, %.', code: 'boxDeliveryMarketplaceCoefExpr'},
    { name: 'Логистика FBS, дополнительный литр, ₽', code: 'boxDeliveryMarketplaceLiter'},
    { name: 'Хранение в день, первый литр, ₽', code: 'boxStorageBase'},
    { name: 'Коэффициент Хранение, %', code: 'boxStorageCoefExpr'},
    { name: 'Хранение в день, дополнительный литр, ₽', code: 'boxStorageLiter'}
]

export async function updateToTable(tableName: string, tableData: Record<string, any>[], searchColumns: string[]) {
    try {
        const allPromise = [];
        for (const item of tableData) {
            const searchParams = Object.fromEntries(searchColumns.map(searchItem => [searchItem, item[searchItem]]));
            allPromise.push(knex(TableStocksCoefs).where(searchParams).update(item));
        }
        await Promise.all(allPromise);
        console.log('Данные успешно обновлены');
    } catch (error) {
        console.error(`Ошибка при обновлении данных в таблицу ${tableName}`, error);
    }
}

export async function getDataFromTable(date: string): Promise<Map<string, StocksCoefs>> {
    const result = await knex.select().table(TableStocksCoefs).where('date', date) as StocksCoefs[];

    return new Map(result.map((row) => [row.house_name, row]));
}