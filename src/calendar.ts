import { DateValidationError } from './composition-calendar'
import Main from './main'
import type { Box, Lang, StateElement, Style } from './type-calendar'

export type CalendarState = {
    lang?: Lang
    nextDate?: (arg: any) => void // function
    nextMonth?: (arg: any) => void // function
    year?: 'en' | 'th'
    value: Date // '2022-10-30'
    min?: Date // '2022-10-30'
    max?: Date // '2022-10-30'
    style?: Style
}

export class swCalendar extends Main {
    /*------------------------------Set---------------------------------*/

    /*-------------x----------------Set-----------------x---------------*/
    private value: Date = new Date()

    protected nextDate?: (arg: Date) => void

    constructor(id: string, config: CalendarState) {
        super(id, 'DAY')
        this.validateConfig(config)
        this.initializeState(config)
    }

    /**
     * กำหนดค่าเริ่มต้นให้กับ state ทั้งหมดของ Calendar
     * @private
     * @param config - ค่า configuration ที่รับมาจาก constructor
     */
    private initializeState(config: CalendarState): void {
        // กำหนดค่าพื้นฐาน
        this.value = config.value || new Date()
        this.ui_value = config.value || new Date()

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

    /**
     * ตรวจสอบความถูกต้องของ config
     * @private
     */
    private validateConfig(config: CalendarState): void {
        if (!config.value) {
            throw new DateValidationError('ต้องระบุค่า value เริ่มต้น')
        }
        if (config.min && config.max && config.min > config.max) {
            throw new DateValidationError('ค่า min ต้องน้อยกว่าหรือเท่ากับ max')
        }
    }

    /**
     * ล้างการเลือกวันที่
     * @public
     */
    public clear(): void {
        this.onSetValue(new Date())
        this.render()
    }

    /**
     * อัพเดทค่า config ของปฏิทิน
     * @public
     * @param config - ค่า config ใหม่
     * @throws {DateValidationError} เมื่อค่า config ไม่ถูกต้อง
     */
    update(config: Partial<CalendarState>) {
        this.validateConfig({ ...this.getState(), ...config } as CalendarState)

        // if  ถูกเรียกมาจากข้างนอกจริง เอาไว้เปลี่ยนค่า วันเดือน ปี ทั้ง ui และ state แล้วทำการ render calendar ใหม่
        if (config.value) {
            this.setDateOfMinMax(config)

            this.onSetValue(config.value)
        }
        this.render()
    }

    /**
     * ดึงค่าสถานะปัจจุบันของปฏิทิน
     * @public
     * @returns สถานะปัจจุบันของปฏิทิน
     */
    public getState(): CalendarState {
        return {
            value: this.value,
            min: this.min,
            max: this.max,
            lang: this.lang,
            year: this.year,
            style: this.style,
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
                    this.onCheckDisabled(_date, this.min, this.max)
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
                    this.onCheckDisabled(_date, this.min, this.max)
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
                    this.onCheckDisabled(_date, this.min, this.max)
                )
            )
        }
        /*-------------x----------------set After-----------------x---------------*/
        days.children = [...beforeLists, ...dayLists, ...afterLists]
        return days
    }

    validateCheckPicker(date: Date): boolean {
        return this.checkSameDate(date, this.value)
    }

    getDateValue() {
        return this.value
    }

    onDatePicker(date: Date): void {
        // event เมื่อ กดเลือกวันที่
        this.onSetValue(date)

        if (typeof this.nextDate == 'function') {
            this.nextDate(date)
        }
        this.render()
    }

    private setDateOfMinMax(config: Partial<CalendarState>) {
        // กำหนดขอบเขตวันที่
        const valueOfDate = this.value.valueOf()
        if (
            config.min instanceof Date &&
            config.min!.valueOf() <= valueOfDate
        ) {
            this.min = config.min
        }

        if (config.max instanceof Date && config.max.valueOf() >= valueOfDate) {
            this.max = config.max
        }
    }
    private onSetValue(date: Date) {
        this.ui_value = date
        this.value = date
    }
}
