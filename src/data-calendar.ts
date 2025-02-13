import type { Lang } from './type-calendar'
export const lists = [
    {
        english: 'January',
        en: 'Jan',
        th: 'ม.ค.',
        thai: 'มกราคม',
        month_value: '01',
        days: 31,
        year: 0,
    },
    {
        english: 'February',
        en: 'Feb',
        th: 'ก.พ.',
        thai: 'กุมภาพันธ์',
        month_value: '02',
        days: 27,
        year: 0,
    },
    {
        english: 'March',
        en: 'Mar',
        th: 'มี.ค.',
        thai: 'มีนาคม',
        month_value: '03',
        days: 31,
        year: 0,
    },
    {
        english: 'April',
        en: 'Apr',
        th: 'เม.ย.',
        thai: 'เมษายน',
        month_value: '04',
        days: 30,
        year: 0,
    },
    {
        english: 'May',
        en: 'May',
        th: 'พ.ค.',
        thai: 'พฤษภาคม',
        month_value: '05',
        days: 31,
        year: 0,
    },
    {
        english: 'June',
        en: 'June',
        th: 'มิ.ย.',
        thai: 'มิถุนายน',
        month_value: '06',
        days: 30,
        year: 0,
    },
    {
        english: 'July',
        en: 'July',
        th: 'ก.ค.',
        thai: 'กรกฎาคม',
        month_value: '07',
        days: 31,
        year: 0,
    },
    {
        english: 'August',
        en: 'Aug',
        th: 'ส.ค.',
        thai: 'สิงหาคม',
        month_value: '08',
        days: 31,
        year: 0,
    },
    {
        english: 'September',
        en: 'Sept',
        th: 'ก.ย.',
        thai: 'กันยายน',
        month_value: '09',
        days: 30,
        year: 0,
    },
    {
        english: 'October',
        en: 'Oct',
        th: 'ต.ค.',
        thai: 'ตุลาคม',
        month_value: '10',
        days: 31,
        year: 0,
    },
    {
        english: 'November',
        en: 'Nov',
        th: 'พ.ย.',
        thai: 'พฤศจิกายน',
        month_value: '11',
        days: 30,
        year: 0,
    },
    {
        english: 'December',
        en: 'Dec',
        th: 'ธ.ค.',
        thai: 'ธันวาคม',
        month_value: '12',
        days: 31,
        year: 0,
    },
]

export const css = ` 
* {
    padding: 0;
    margin: 0;
    box-sizing: border-box;
}

[calendar='root'] {
    --font-family: 'Arial', sans-serif;
    --background: #f3f8fe;
    --picker: #0ea5e9;
    --text-picker: #fff;
    --dateRadius: 50%;
    --disabled: #c3c2c8; /* disabled */
    --current: #ffdfd2;
    --text: #151426;
    --text-week: #1e293b;
    --borderRadius: .75rem;
    --border: none;
    --width: 290px;


    --shadow: none;
    --text-current: #ffffff; /* text current */
    --week-line: #cbd5e1; 

    min-width: var(--width);
    max-width: var(--width);

    --h_header: 40px;

}
[data-box='container'] {
    font-family: var(--font-family);
    box-shadow: var(--shadow);
    border-radius: var(--borderRadius);
    border: var(--border);
    width: inherit;
    height: max-content;
    background-color: var(--background);
    overflow: hidden;
    position: relative;
}

:is([data-type='YEAR'],[data-type='MONTH']) :is([data-box='menu-container'],[data-box='menu-header']){
    display: flex;
}
[data-type='MONTH'] [data-box='menu-month-container']{
    display: grid;
}
[data-type='YEAR'] [data-box='menu-year-container']{
    display: grid;
}



[data-box='container'][data-type='CALENDAR'] :is([data-box='body-week'],[data-box='body-day']){
    display: grid;
}
[data-box='container'][data-type='CALENDAR'] :is([data-box='body-header']){
    display: flex;
}

[data-box='body-header'],[data-box='menu-header'] {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-weight: 700;
    color: var(--text);
    padding: 0;
    overflow: hidden;
    display: none;
}
 
     
:is([data-box='month'],[data-box='year'],[data-box='menu-year']):hover {
    color: var(--picker);

}      
.calendar--arrow:hover {
    border-color: var(--picker);
}      
   
:is([data-box='month'],[data-box='year'],[data-box='menu-year']){
    padding: 0px;
    cursor: pointer;
    position: relative;
    font-style: normal;
    font-weight: 700;
    font-size: 18px;
    width: 100%;
    height: var(--h_header);
    align-items: center;
    display: flex;
    justify-content: center;

}

[data-box='body-week'] {
    font-weight: 400;
    grid-template-columns: repeat(7, 1fr);
    color: var(--text);
    font-size: 1rem;
    border-top: 1px solid var(--week-line);
    border-bottom: 1px solid var(--week-line);
    display: none;
}
[data-box='body-week'] div {
    color: var(--text-week);
    height: 36px;
    background: inherit;
    display: flex;
    justify-content: center;
    align-items: center;
}
[data-box='body-day'] {
    grid-template-columns: repeat(7, 1fr);
    color: var(--text);
    display: none;
}
[data-box='body-day'] div {
    display: grid;
    place-items: center;
    padding: 0px;
    position: relative;
    cursor: pointer;
    width: 100%;
    aspect-ratio: 1/1;
    font-size: 1rem;
    transform: scale(1.005, 0.95);
}

[data-box='body-day'] [tabindex='-1'] {
    cursor: no-drop !important;
    background-color: inherit;
    opacity: 0.3;
    text-decoration: line-through;
    pointer-events: none;
    color: var(--text);
}

:is([aria-placeholder='before'],[aria-placeholder='after']) {
    color: var(--disabled);
    cursor: pointer;
}    
[data-box='body-day'] [aria-placeholder='current'] {
    background-color: var(--current);
    color: var(--text-current);
    font-size: 20px;
    font-weight: 700;
    border-radius: var(--dateRadius);
}

[data-box='body-day'] [aria-selected='true'][aria-details='DAY'] {
    background-color: var(--picker);
    border-radius: var(--dateRadius);
    border: 2px solid #ebf0fc;
    color: var(--text-picker);
}

[data-box='body-day'] :is(.first,.last) {
    background-color: var(--picker);
    border-radius: var(--dateRadius);
    border: 2px solid #ebf0fc;
    color: var(--text-picker);
    isolation: isolate;
    z-index:1;
    position: relative;
}

.between:not(:is(.first,.last)) {
    position: relative;
    border-radius: 0%;
    color: var(--text-picker);
    background-color: var(--picker);
    border-radius: var(--dateRadius);
    opacity: 0.75;
}

[aria-placeholder='current'].between {
    color: var(--text-color);
    
}




:is([data-box='arrow'], [data-box='menu-arrow']) {
    width: 42px;
    height: var(--h_header);
    background-color: transparent;
    cursor: pointer;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 0px 16px;
}
:is([data-box='arrow'], [data-box='menu-arrow']):has(.right) {
    justify-content: flex-end;
}
.calendar--arrow {
    border: solid var(--text);
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 3px;
}

.calendar--arrow.right {
    transform: rotate(-45deg);
    -webkit-transform: rotate(-45deg);
}

.calendar--arrow.left {
    transform: rotate(135deg);
    -webkit-transform: rotate(135deg);
}

.calendar--arrow.up {
    transform: rotate(-135deg);
    -webkit-transform: rotate(-135deg);
}

.calendar--arrow.down {
    transform: rotate(45deg);
    -webkit-transform: rotate(45deg);
}


[data-box='menu-container'] {
    flex-direction: column;
    width: var(--width);
    display: none;
}

[data-box='menu-month-container'] {
    display: none;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 8px;
    padding: 16px;
}

[data-box='menu-year-container'] {
    display: none;
    grid-template-columns: repeat(4, 1fr);
    grid-gap: 8px;
    padding: 16px;
}

[attr-menu-content] {
    border-radius: 6px;
    padding: 8px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
}
[attr-menu-content]:hover {
    background-color: #F3F4F6;
}
[attr-menu-content='true'] {
    background-color: var(--picker) !important;
    color: var(--text-picker) !important;
}

`

export const onWeeks = (lang: Lang): string[] => {
    if (lang === 'th' || lang === 'thai') {
        return ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
    } else if (lang === 'en' || lang === 'english') {
        return ['Sun', 'Mon', 'Tue', 'Wen', 'Thu', 'Fri', 'Sat']
    } else return ['Sun', 'Mon', 'Tue', 'Wen', 'Thu', 'Fri', 'Sat']
}

// let EnumStyle: Required<Style> = {
//     /**
//      * สีตัวอักษรวันที่กดเลือก
//      */
//     ['font-family']: `'Arial', sans-serif`,
//     /**
//      * สีตัวอักษรวันที่กดเลือก
//      */
//     ['text-picker']: '#fff', // สีตัวอักษรวันที่กดเลือก --text-picker
//     picker: '#0ea5e9', // สีวันที่กดเลือก --picker
//     dateRadius: '50%', // รัศมีวันที่กดเลือก --dateRadius
//     disabled: '#c3c2c8', // สีวันที่ถูก disabled  --disabled
//     background: '#f3f8fe', //--background
//     text: '#151426', //สีตัวอักษร
//     ['text-week']: '#1e293b', //สีตัวอักษร
//     current: '#ffdfd2', // สีวันที่ปัจจุบัน --calendar_date_current
//     border: 'none', //--border
//     borderRadius: '0.75rem', //--borderRadius
//     shadow: 'none',
//     width: '300px',
// }
