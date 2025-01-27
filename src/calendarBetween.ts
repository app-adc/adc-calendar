import { addMonth } from 'adc-directive'
import { DateValidationError } from './composition-calendar'
import Main from './main'
import { StateElement, Style } from './type-calendar'
type Box = StateElement & {
    children: StateElement[]
}

export type CalendarBetweenState = {
    lang?: 'thai' | 'en' | 'th' | 'english'
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
    private category: 'DAY' | 'BETWEEN' = 'BETWEEN' // type day

    /*-------------x----------------Set-----------------x---------------*/

    private lang: 'thai' | 'en' | 'th' | 'english' = 'en'
    private nextDate?: ((arg: Date[]) => void) | undefined
    private nextMonth?: ((arg: Date) => void) | undefined
    private year: 'en' | 'th' = 'th'
    private min: Date = new Date()
    private max: Date = new Date('2200-01-01')

    private ui_value: Date = new Date()
    private style?: Style = {}
    private values: Date[] = [new Date(), new Date()]

    private betweens: Array<Date | undefined> = [new Date(), new Date()]

    constructor(id: string, config: CalendarBetweenState) {
        super(id)
        this.validateConfig(config)
        this.initializeState(config)
        if (this.isClient()) {
            setTimeout(() => {
                this.setupAccessibility()
                this.mount()
            }, 0)
        }
    }

    render() {
        if (!this.isClient()) return
        const { root } = this.validateRootEl()

        if (!root) return

        this.startInit()
        this.setStyle(root, this.style!)

        const container: Box = {
            tag: 'div',
            props: {
                calendar: `container`,
            },
            children: [],
        }

        container.children = [this.createHeader(), this.createBody()]
        this.createBox(root, container)
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
        this.lang = config.lang || 'en'

        this.nextDate =
            typeof config.nextDate == 'function' ? config.nextDate : undefined
        this.nextMonth =
            typeof config.nextMonth == 'function' ? config.nextMonth : undefined

        this.year = config.year == 'th' ? 'th' : 'en' // พ.ศ.  ค.ศ.
        if (typeof config.style == 'object' && config.style != null) {
            this.style = Object.assign(this.style!, config.style)
        }

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
        config: Partial<Pick<CalendarBetweenState, 'max' | 'min' | 'values'>>
    ) {
        this.validateConfig({
            ...this.getState(),
            ...config,
        } as CalendarBetweenState)
        // if  ถูกเรียกมาจากข้างนอกจริง เอาไว้เปลี่ยนค่า วันเดือน ปี ทั้ง ui และ state แล้วทำการ render calendar ใหม่
        if (config.values) {
            this.setDateOfMinMax(config)

            this.onSetOption('SET_VALUE_AND_UI', config.values)
        }
        this.render()
    }
    getState() {
        return {
            id: this.id,
            value: this.values,
            ui_value: this.ui_value,
            el: this.rootEl(),
        }
    }

    private createHeader(): Box {
        const header: Box = {
            tag: 'div',
            props: {
                calendar: `header`,
            },
            children: [],
        }
        const arrow = (icon: 'LEFT' | 'RIGHT') => {
            const res: Box = {
                tag: 'div',
                props: {
                    class: 'calendar__icon-arrow',
                },
                methods: {
                    click: () => this.onChangeMonth(icon),
                },
                children: [
                    {
                        tag: 'span',
                        props: {
                            class: `calendar--arrow ${icon.toLocaleLowerCase()}`,
                        },
                    },
                ],
            }

            return res
        }
        const yearType = this.year === 'th' ? 543 : 0
        const month = this.getMonth(this.ui_value)[this.lang || 'th']
        const year = this.ui_value.getFullYear() + yearType
        const title: StateElement = {
            tag: 'div',
            props: {
                class: 'title',
            },
            children: `${month} ${year}`,
        }

        header.children = [arrow('LEFT'), title, arrow('RIGHT')]

        return header
    }
    private createBody(): Box {
        const body: Box = {
            tag: 'div',
            props: {
                calendar: `body`,
            },
            children: [],
        }

        body.children = [this.createWeeks(), this.createDays()]

        return body
    }
    private createWeeks(): Box {
        const weeks: Box = {
            tag: 'div',
            props: {
                calendar: `body-week`,
            },
            children: [],
        }
        let type_week: 'en' | 'th' = ['en', 'english'].includes(this.lang!)
            ? 'en'
            : 'th'

        this.onWeeks(type_week).forEach((v) => {
            weeks.children.push({
                tag: 'div',
                children: v,
            })
        })
        return weeks
    }
    private createDays(): Box {
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
                    'd_before' + ` ${clsBetween(_date)}`,
                    this.onCheckDisabled(_date, this.min, this.max)
                )
            )
        })
        /*-------------x----------------set Before-----------------x---------------*/
        /*------------------------------set Day---------------------------------*/
        for (let i = 0; i < this.getMonth(date).days; i++) {
            const _date = new Date(date.getFullYear(), date.getMonth(), i + 1)
            const current = this.checkSameDate(new Date(), _date)
                ? ' current_date'
                : ''

            dayLists.push(
                this.createDate(
                    _date,
                    current + ` ${clsBetween(_date)}`,
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
                    'd_after' + ` ${clsBetween(_date)}`,
                    this.onCheckDisabled(_date, this.min, this.max)
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

    private createDate(
        date: Date,
        className: string,
        isDisabled: boolean = false
    ): StateElement {
        const data: StateElement = {
            tag: 'div',
            props: {
                class: className,
                data_type: this.category,
            },
            children: date.getDate() + '',
            methods: {
                click: () => this.onDatePicker(date),
            },
        }

        if (isDisabled) data.props!['calendar'] = 'disabled'
        if (this.checkSameDate(date, this.betweens[0]!))
            data.props!['class'] += ' picker_date'

        return data
    }

    private onSortDate(a: Date, b: Date): Date[] {
        const startDate = a < b ? a : b
        const endDate = a > b ? a : b

        return [startDate, endDate]
    }

    private onDatePicker(date: Date): void {
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
            this.onSetOption('SET_VALUE_AND_UI', this.values)

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

    private onChangeMonth(type: 'LEFT' | 'RIGHT') {
        const uiValue = addMonth(this.ui_value, type === 'LEFT' ? -1 : 1)

        this.onSetOption('SET_UI', [uiValue])

        if (typeof this.nextMonth == 'function') {
            this.nextMonth(uiValue)
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
    private onSetOption(type: 'SET_UI' | 'SET_VALUE_AND_UI', dates: Date[]) {
        //set หน้าปฏิทิน ว่าอยู่เดือนไหน หรือ set value
        if (type === 'SET_VALUE_AND_UI') {
            this.ui_value = dates[0]
            this.values = dates
        } else if (type === 'SET_UI') {
            // ตอนกดเปลี่ยนเดือน
            this.ui_value = dates[0]
        }
    }

    /**
     * ตั้งค่า ARIA attributes สำหรับการเข้าถึง
     * @private
     */
    private setupAccessibility(): void {
        const container = this.rootEl()
        container.setAttribute('role', 'application')
        container.setAttribute('aria-label', 'ปฏิทิน')
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
