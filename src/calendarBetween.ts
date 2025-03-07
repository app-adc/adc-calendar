import { DateValidationError } from './composition-calendar'
import Main from './main'
import type { Lang, StateElement, Style } from './type-calendar'
type Box = StateElement & {
    children: StateElement[]
}

export type CalendarBetweenState = {
    lang?: Lang
    nextDate?: (arg: any) => void // function
    nextMonth?: (arg: any) => void // function
    year?: 'en' | 'th'

    values: Date[]
    min?: Date // '2022-10-30'
    max?: Date // '2022-10-30'
    style?: Style
}

export class swCalendarBetween extends Main {
    /*------------------------------Set---------------------------------*/

    /*-------------x----------------Set-----------------x---------------*/

    private nextDate?: (arg: Date[]) => void

    private values: Date[] = [new Date(), new Date()]

    private betweens: Array<Date | undefined> = [new Date(), new Date()]

    constructor(id: string, config: CalendarBetweenState) {
        super(id, 'BETWEEN')
        this.validateConfig(config)
        this.initializeState(config)
    }

    /**
     * กำหนดค่าเริ่มต้นให้กับ state ทั้งหมดของ Calendar
     * @private
     * @param config - ค่า configuration ที่รับมาจาก constructor
     */
    private initializeState(config: CalendarBetweenState): void {
        const startDate = config.values[0] || new Date()
        const endDate = config.values[1] || new Date()
        this.values = [startDate, endDate]
        this.ui_value = this.getValues()[0]!
        this.betweens = this.values

        // กำหนดภาษาและรูปแบบปี
        this.lang = config.lang || 'en'
        this.year = config.year === 'th' ? 'th' : 'en'

        // กำหนด callbacks
        this.nextDate = config.nextDate
        this.nextMonth = config.nextMonth

        this.setDateOfMinMax(config)

        // กำหนด style
        if (typeof config.style === 'object' && config.style !== null) {
            this.style = {
                ...this.style,
                ...config.style,
            }
        }
    }

    update(
        config: Partial<
            Pick<CalendarBetweenState, 'max' | 'min' | 'values' | 'style'>
        >
    ) {
        this.validateConfig({
            ...this.getState(),
            ...config,
        } as CalendarBetweenState)
        // if  ถูกเรียกมาจากข้างนอกจริง เอาไว้เปลี่ยนค่า วันเดือน ปี ทั้ง ui และ state แล้วทำการ render calendar ใหม่

        // อัพเดทค่า style ถ้ามีการกำหนดใน config
        if (config.style && typeof config.style === 'object') {
            this.style = {
                ...this.style,
                ...config.style,
            }
        }
        if (config.values) {
            this.setDateOfMinMax(config)

            this.onSetValue(config.values)
        }
        this.render()
    }
    getState() {
        return {
            id: this.id,
            value: this.values,
            ui_value: this.ui_value,
            el: this.validateRootEl().root,
        }
    }

    createDays(): Box {
        const days: Box = {
            tag: 'div',
            props: {
                calendar: `body-day`,
            },
            children: [],
        }
        const date = this.ui_value
        const [first_week, last_week] = this.onBeforeAfterDay(date)

        const dateBetweens = this.getDatesInRange().map((d) =>
            this.dateToString(d)
        )

        const clsBetween = (date: Date) => {
            const index = dateBetweens.indexOf(this.dateToString(date))
            let cls = []
            if (this.category == 'BETWEEN') {
                if (index !== -1) cls.push('between')
                if (index == 0) cls.push('first')
                if (index == dateBetweens.length - 1) cls.push('last')
            }

            return cls.join(' ')
        }

        /*------------------------------set Before---------------------------------*/
        const _beforeDays = (): Date[] => {
            const lists: Date[] = []
            for (let i = 0; i < first_week; i++) {
                const index_month =
                    date.getMonth() === 0 ? 11 : date.getMonth() - 1
                const days = this.getYear(date)[index_month].days // เดือนก่อนหน้า
                const day = days - (first_week - 1) + i
                const _year =
                    date.getMonth() === 0
                        ? date.getFullYear() - 1
                        : date.getFullYear()

                lists.push(new Date(_year, index_month, day))
            }

            return lists
        }
        const beforeLists: Array<StateElement> = []
        const dayLists: Array<StateElement> = []
        const afterLists: Array<StateElement> = []
        _beforeDays().forEach((_date) => {
            beforeLists.push(
                this.createDate(
                    _date,
                    'before',
                    this.onCheckDisabled(_date, this.min, this.max),
                    clsBetween(_date)
                )
            )
        })
        /*-------------x----------------set Before-----------------x---------------*/
        /*------------------------------set Day---------------------------------*/
        for (let i = 0; i < this.getMonth(date).days; i++) {
            const _date = new Date(date.getFullYear(), date.getMonth(), i + 1)
            const current = this.checkSameDate(new Date(), _date)
                ? 'current'
                : 'date'

            dayLists.push(
                this.createDate(
                    _date,
                    current,
                    this.onCheckDisabled(_date, this.min, this.max),
                    clsBetween(_date)
                )
            )
        }
        /*-------------x----------------set Day-----------------x---------------*/
        /*------------------------------set After---------------------------------*/
        for (let i = 0; i < last_week; i++) {
            const _year =
                this.ui_value.getMonth() === 11
                    ? this.ui_value.getFullYear() + 1
                    : this.ui_value.getFullYear()
            const _month =
                this.ui_value.getMonth() === 11
                    ? 0
                    : this.ui_value.getMonth() + 1
            const _date = new Date(_year, _month, i + 1)
            afterLists.push(
                this.createDate(
                    _date,
                    'after',
                    this.onCheckDisabled(_date, this.min, this.max),
                    clsBetween(_date)
                )
            )
        }
        /*-------------x----------------set After-----------------x---------------*/
        days.children = [...beforeLists, ...dayLists, ...afterLists]
        return days
    }

    private getValues() {
        const startDate =
            this.values[0]! < this.values[1]! ? this.values[0] : this.values[1]
        const endDate =
            this.values[0]! > this.values[1]! ? this.values[0] : this.values[1]

        this.values = [startDate!, endDate!]
        return [startDate!, endDate!]
    }

    private getDatesInRange(): Date[] {
        const lists = []
        const [startDate, endDate] = this.getValues()
        const date = new Date(startDate.getTime())
        while (date <= endDate!) {
            lists.push(new Date(date))
            date.setDate(date.getDate() + 1)
        }

        return lists
    }

    private dateToString(date: Date) {
        const day = date.getDate()
        const month = date.getMonth() + 1
        const year = date.getFullYear()
        const currentDate = `${year}-${month}-${day}`
        return currentDate
    }

    private onSortDate(a: Date, b: Date): Date[] {
        const startDate = a < b ? a : b
        const endDate = a > b ? a : b

        return [startDate, endDate]
    }

    validateCheckPicker(date: Date): boolean {
        return this.checkSameDate(date, this.betweens[0]!)
    }

    getDateValue() {
        return this.values[0]
    }

    onDatePicker(date: Date): void {
        // event เมื่อ กดเลือกวันที่

        this.category = 'DAY'
        if (this.betweens[0] === undefined) {
            this.betweens[0] = date
            // this.is_end_process_between = false
        } else if (this.betweens[0] && this.betweens[1] === undefined) {
            // คือการออก event nextDate
            this.category = 'BETWEEN'
            this.betweens = this.onSortDate(this.betweens[0], date)
            this.values = [this.betweens[0]!, this.betweens[1]!]
            // this.is_end_process_between = true
            this.onSetValue(this.values)

            if (typeof this.nextDate == 'function') {
                this.nextDate(this.values)
            }
        } else if (this.betweens[0] && this.betweens[1]) {
            this.betweens[0] = date
            this.betweens[1] = undefined
            // this.is_end_process_between = false
        }

        this.render()
    }

    private setDateOfMinMax(
        config: Partial<Pick<CalendarBetweenState, 'max' | 'min' | 'values'>>
    ) {
        const [start, end] = this.getValues()
        const valueOfStart = start.valueOf()
        const valueOfEnd = end.valueOf()
        if (
            config.min instanceof Date &&
            config.min!.valueOf() <= valueOfStart
        ) {
            this.min = config.min
        }

        if (config.max instanceof Date && config.max.valueOf() >= valueOfEnd) {
            this.max = config.max
        }
    }
    private onSetValue(dates: Date[]) {
        //set หน้าปฏิทิน ว่าอยู่เดือนไหน หรือ set value
        this.ui_value = dates[0]
        this.values = dates
    }

    /**
     * ตรวจสอบความถูกต้องของ config
     * @private
     */
    private validateConfig(config: CalendarBetweenState): void {
        if (config.values.length !== 2) {
            throw new DateValidationError('ต้องระบุค่า Date between เริ่มต้น')
        }
        if (config.min && config.max && config.min > config.max) {
            throw new DateValidationError('ค่า min ต้องน้อยกว่าหรือเท่ากับ max')
        }
    }
}
