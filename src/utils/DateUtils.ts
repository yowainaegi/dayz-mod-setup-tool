const DateFormat = {
    YYYY_MM_DD: 'YYYY-MM-DD',
    YYYY_MM_DD_HH_mm_ss: 'YYYY-MM-DD HH:mm:ss',
}


/**
 * 获取当前日期
 */
const now = (): Date => {
    return new Date();
}

/**
 * 带有时间戳的日期根据format转换
 */
const dateFormat =(date: string, formatStr: string): string => {
    return format(date, formatStr)
}

function format(timestampString: string, format: string): string {
    const date = new Date(parseInt(timestampString));

    const year = date.getFullYear();
    const month = `0${date.getMonth() + 1}`.slice(-2);
    const day = `0${date.getDate()}`.slice(-2);
    const hours = `0${date.getHours()}`.slice(-2);
    const minutes = `0${date.getMinutes()}`.slice(-2);
    const seconds = `0${date.getSeconds()}`.slice(-2);

    const formattedString = format
        .replace('YYYY', year.toString())
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);

    return formattedString;
}

export {
    now,
    dateFormat,
    DateFormat
}