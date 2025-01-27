import { addDate, addMonth } from 'adc-directive'
import { css, lists } from './data-calendar'
import { Box, Lists, StateElement, Style } from './type-calendar'

let EnumStyle: Required<Style> = {
    /**
     * สีตัวอักษรวันที่กดเลือก
     */
    ['font-family']: `'Arial', sans-serif`,
    /**
     * สีตัวอักษรวันที่กดเลือก
     */
    ['text-picker']: '#fff', // สีตัวอักษรวันที่กดเลือก --text-picker
    picker: '#0ea5e9', // สีวันที่กดเลือก --picker
    dateRadius: '50%', // รัศมีวันที่กดเลือก --dateRadius
    disabled: '#c3c2c8', // สีวันที่ถูก disabled  --disabled
    background: '#f3f8fe', //--background
    text: '#151426', //สีตัวอักษร
    ['text-week']: '#1e293b', //สีตัวอักษร
    current: '#ffdfd2', // สีวันที่ปัจจุบัน --calendar_date_current
    border: 'none', //--border
    borderRadius: '0.75rem', //--borderRadius
    shadow: 'none',
    width: '300px',
}

abstract class main {
    protected id: string
    private mounted: boolean = false

    protected lang: 'thai' | 'en' | 'th' | 'english' = 'en'
    protected year: 'en' | 'th' = 'th'
    protected min: Date = new Date()
    protected max: Date = new Date('2200-01-01')
    protected ui_value: Date = new Date()
    protected category: 'DAY' | 'BETWEEN'

    protected style: Style = {}

    protected nextMonth?: (arg: Date) => void

    constructor(id: string, category: 'DAY' | 'BETWEEN') {
        this.id = id
        this.category = category
    }
    // ประกาศ abstract method
    abstract createDays(): Box
    abstract onDatePicker(date: Date): void
    abstract validateCheckPicker(date: Date): boolean

    // abstract render(): void
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

    protected startInit() {
        if (!this.isClient()) return

        const { root, rootContainer } = this.validateRootEl()

        if (!root) return

        if (rootContainer) {
            rootContainer.remove()
        }
        // Create some CSS to apply to the shadow dom
        const style = document.createElement('style')

        style.textContent = css

        root.appendChild(style)
        root.setAttribute('calendar', 'root')
    }

    protected validateRootEl() {
        if (!this.isClient()) return { root: null, rootContainer: null }
        const root = this.rootEl()
        return {
            root,
            rootContainer:
                root?.querySelector(`[calendar="container"]`) || null,
        }
    }

    protected isClient() {
        return typeof window !== 'undefined'
    }

    protected createWeeks(): Box {
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

    protected createHeader(): Box {
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

    protected createBody(): Box {
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

    protected createDate(
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
        if (this.validateCheckPicker(date))
            data.props!['class'] += ' picker_date'

        return data
    }

    protected onChangeMonth(type: 'LEFT' | 'RIGHT') {
        const uiValue = addMonth(this.ui_value, type === 'LEFT' ? -1 : 1)

        this.ui_value = uiValue

        if (typeof this.nextMonth == 'function') {
            this.nextMonth(uiValue)
        }
        this.render()
    }

    /**
     * Stops the calendar by removing it from the DOM.
     */
    stop(mileSecond: number = 200) {
        // ลบทิ้งเพ่อสร้างใหม่ หรือ การสั่งปิด calendar
        setTimeout(() => {
            const { rootContainer } = this.validateRootEl()
            if (rootContainer) {
                rootContainer.remove()
            }
        }, mileSecond)
    }

    // protected setStyle(shadow: HTMLElement, style: Record<string, any>) {
    protected setStyle(shadow: HTMLElement, style: Style) {
        const keys = Object.keys(style)
        keys.forEach((k) => {
            const val = `${(style! as any)[k]}`
            if (k in style!)
                shadow.style.setProperty(`--${k}`, val, 'important')
        })
    }

    protected rootEl(): HTMLElement | null {
        if (!this.isClient()) return null
        const root = document.querySelector(this.id) as HTMLElement
        return root
    }

    protected createBox(box: HTMLElement, vNode: StateElement) {
        const el = (vNode.el = document.createElement(vNode.tag))

        if (vNode.props) {
            for (const key in vNode.props) {
                const value = vNode.props[key]
                el.setAttribute(key, value)
            }
        }
        if (vNode.children) {
            if (typeof vNode.children === 'string') {
                el.textContent = vNode.children
            } else {
                vNode.children.forEach((child) => {
                    this.createBox(el, child)
                })
            }
        }
        if (vNode.methods) {
            for (const key in vNode.methods) {
                const fn = vNode.methods[
                    key as keyof StateElement['methods']
                ] as (...arg: any) => void
                el.addEventListener(key, (event) => fn(event))
            }
        }

        box.appendChild(el)
    }

    protected onCheckDisabled(date: Date, min: Date, max: Date) {
        const dateValueOf = date.valueOf()
        const minValueOf = addDate(min, -1).valueOf()
        const maxValueOf = max.valueOf()
        return dateValueOf < minValueOf || dateValueOf > maxValueOf
    }
    protected onWeeks(type: 'th' | 'en'): string[] {
        const weeks = {
            th: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'],
            en: ['Sun', 'Mon', 'Tue', 'Wen', 'Thu', 'Fri', 'Sat'],
        }

        return weeks[type]
    }

    protected checkSameDate(a: Date, b: Date) {
        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        )
    }

    protected onBeforeAfterDay(date: Date): [number, number] {
        let first_day = new Date(date.getFullYear(), date.getMonth(), 1)
        let last_day = new Date(
            date.getFullYear(),
            date.getMonth(),
            this.getMonth(date).days
        )

        return [first_day.getDay(), 7 - (last_day.getDay() + 1)] // ช่องว่างก่อนเริ่มวันที่ 1,ช่องว่างหลังสิ้นเดือน
    }

    protected getYear(date: Date) {
        const _getFebDays = (year: number) => {
            let isLeapYear =
                (year % 4 === 0 && year % 100 !== 0 && year % 400 !== 0) ||
                (year % 100 === 0 && year % 400 === 0)
            return isLeapYear ? 29 : 28
        }
        const items: Lists = []
        lists.forEach((m, i) => {
            m.year = date.getFullYear()
            if (i === 1) {
                m.days = _getFebDays(date.getFullYear())
            }

            items.push(m)
        })
        return items
    }
    protected getMonth(date: Date) {
        const year = this.getYear(date)

        return year[date.getMonth()]
    }

    /**
     * ตั้งค่า ARIA attributes สำหรับการเข้าถึง
     */
    protected setupAccessibility(): void {
        const root = this.rootEl()
        if (!root) return
        root.setAttribute('role', 'application')
        root.setAttribute('aria-label', 'ปฏิทิน')
    }

    // Add mount method
    protected mount() {
        if (this.mounted) return
        this.mounted = true
        if (this.isClient()) {
            this.render()
        }
    }
}

export default main
