import { addDate } from 'adc-directive'
import { css, lists } from './data-calendar'
import { Lists, StateElement, Style } from './type-calendar'

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
    constructor(id: string) {
        this.id = id
    }
    // ประกาศ abstract method
    abstract render(): void

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
