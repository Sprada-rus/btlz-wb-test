export function getCurrentDate(){
    const date = new Date();
    const month = date.getMonth() + 1;
    let monthStr = month.toString();
    if (month < 10) monthStr = "0" + monthStr;
    return date.getFullYear() + '-' + monthStr + '-' + date.getDate();
}

export async function sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(() => res(), ms));
}