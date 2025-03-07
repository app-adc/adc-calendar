import { addDate, addMonth, dateToCombine } from 'adc-directive'
import { renderBodyDay } from './composition-calendar'
import { css, lists, onWeeks } from './data-calendar'
import type { Box, Lang, Lists, StateElement, Style } from './type-calendar'

abstract class main {
    protected id: string
    /**
     * check สถานะของปฏิทินว่าเป็น created หรือไม่
     */
    public created: boolean = false

    /**
     * ประเภทของปฏิทิน
     */
    private calendarType: 'CALENDAR' | 'MONTH' | 'YEAR' = 'CALENDAR'
    private eventListeners: Array<{
        element: Element
        type: string
        handler: EventListener
    }> = []

    // จำนวนปีที่จะแสดงในเมนูปี
    private countYear: number = 15

    protected lang: Lang = 'en'
    protected year: 'en' | 'th' = 'en'
    protected min: Date = new Date()
    protected max: Date = new Date('2200-01-01')

    /**
     * ค่าที่ใช้ในการแสดง UI
     */
    protected ui_value: Date = new Date()
    protected category: 'DAY' | 'BETWEEN'

    protected style: Style = {}

    protected nextMonth?: (arg: Date) => void

    constructor(id: string, category: 'DAY' | 'BETWEEN') {
        this.id = id
        this.category = category
        this.initStyleAndCss()

        this.setupAccessibility()
    }
    // ประกาศ abstract method
    abstract createDays(): Box
    abstract onDatePicker(date: Date): void
    /**
     * ตรวจสอบว่าวันที่ที่เลือกมีค่าตรงกับ picker หรือไม่
     */
    abstract validateCheckPicker(date: Date): boolean
    abstract getDateValue(): Date

    // abstract render(): void
    render() {
        if (!this.isClient()) return
        const { root, rootContainer } = this.validateRootEl()

        if (!root) return

        // อัพเดท style ทุกครั้งที่ render
        this.applyStyles()

        if (rootContainer) {
            rootContainer.setAttribute('data-type', this.calendarType)
            if (this.calendarType === 'CALENDAR') {
                this.updateContentCalendar(rootContainer)
            } else {
                this.updateContentMenu(rootContainer)
            }
        } else {
            this.createInitialContainer(root)
        }

        this.initInputHidden()
    }
    /**
     * update การ render ส่วนของเมนู
     * @param container [data-box="container"]
     */
    private updateContentMenu(container: Element) {
        const menu = container.querySelector('[data-box="menu-container"]')
        if (!menu) return
        const yearTitle = menu.querySelector('[data-box="menu-year"]')
        const { year } = this.getConfigValue()

        // อัพเดทส่วน header
        if (yearTitle) {
            yearTitle.textContent = `${year}`
        }
    }

    /**
     * update การ render ส่วนของปฏิทิน
     * @param container [data-box="container"]
     */
    private updateContentCalendar(container: Element) {
        // เก็บข้อมูล elements ที่ต้องการอัพเดท
        const daysContainer = container.querySelector('[data-box="body-day"]')
        const monthTitle = container.querySelector('[data-box="month"]')
        const yearTitle = container.querySelector('[data-box="year"]')

        // อัพเดทส่วนแสดงวันที่
        if (daysContainer) {
            renderBodyDay(daysContainer, this.createDays())
        }

        const { month, year } = this.getConfigValue()

        // อัพเดทส่วน header
        if (yearTitle) {
            yearTitle.textContent = `${year}`
        }
        if (monthTitle) {
            monthTitle.textContent = `${month}`
        }
    }

    private getConfigValue() {
        // คำนวณค่าปีตามรูปแบบที่กำหนด (พ.ศ. หรือ ค.ศ.)
        const yearType = this.year === 'th' ? 543 : 0
        const month = this.getMonth(this.ui_value)[this.lang || 'th']
        const year = this.ui_value.getFullYear() + yearType

        return {
            year,
            month,
        }
    }

    protected validateRootEl() {
        const root = document.querySelector(this.id) as HTMLElement

        if (!this.isClient() && !root)
            return { root: null, rootContainer: null }
        return {
            root,
            rootContainer:
                root?.querySelector(`[data-box="container"]`) || null,
        }
    }

    protected isClient() {
        return typeof window !== 'undefined'
    }

    protected createDate(
        date: Date,
        placeholder: 'current' | 'date' | 'before' | 'after',
        isDisabled: boolean = false,
        className?: string
    ): StateElement {
        const data: StateElement = {
            tag: 'div',
            props: {
                role: 'gridcell',
                'aria-details': this.category, // สำหรับเช็คว่าเป็นวันที่ระหว่างหรือไม่
                'aria-label': dateToCombine(date).valueOfDate, // ใช้เป็นค่าสำหรับ update this.ui_value
                'aria-selected': this.validateCheckPicker(date).toString(), // สำหรับเช็คว่าเป็นวันที่ที่เลือกหรือไม่ datepicker
                tabindex: isDisabled ? '-1' : '0', // สำหรับเช็คว่าเป็นวันที่ disabled หรือไม่
                'aria-placeholder': placeholder,
            },
            children: date.getDate() + '',
        }
        if (className) {
            data.props!['class'] = className
        }

        // if (isDisabled) data.props!['calendar'] = 'disabled'

        return data
    }

    protected onChangeMonth(type: 'LEFT' | 'RIGHT') {
        const d = this.ui_value
        let year = d.getFullYear()
        let month = d.getMonth() + 1
        if (this.calendarType === 'CALENDAR') {
            const date = new Date(`${year}-${month}-01`)
            this.ui_value = addMonth(date, type === 'LEFT' ? -1 : 1)
            if (typeof this.nextMonth == 'function') {
                this.nextMonth(this.ui_value)
            }
        } else if (this.calendarType === 'MONTH') {
            year += type === 'LEFT' ? -1 : 1
            this.ui_value = new Date(`${year}-${month}-01`)
        } else if (this.calendarType === 'YEAR') {
            const num = type === 'LEFT' ? -16 : 16
            this.ui_value = new Date(`${year + num}-${month}-01`)
            this.renderUpdateYearMenu()
        }

        this.render()
    }

    /**
     * stop คือการทำลาย container ปฏิธินทั้งหมด
     */
    stop() {
        if (!this.created) return

        requestAnimationFrame(() => {
            const { rootContainer } = this.validateRootEl()
            if (rootContainer) {
                rootContainer.remove()
                this.destroyEvent()
            }

            // reset state
            this.created = false
        })
    }

    /**
     * ใช้สำหรับการนำค่า style ที่กำหนดไว้ใน this.style ไปใช้กับ root element
     * จะถูกเรียกทุกครั้งที่มีการ render เพื่อให้มั่นใจว่า style เป็นปัจจุบันเสมอ
     */
    protected applyStyles(): void {
        // ดึง root element
        const { root } = this.validateRootEl()
        if (!root) return

        // นำ custom styles จาก this.style ไปใช้กับ root element
        if (this.style && typeof this.style === 'object') {
            for (const key in this.style) {
                if (Object.prototype.hasOwnProperty.call(this.style, key)) {
                    const value = `${(this.style as any)[key]}`
                    // กำหนด CSS custom property ให้กับ root element
                    root.style.setProperty(`--${key}`, value, 'important')
                }
            }
        }
    }

    /**
     * แยกส่วนของการกำหนด style และการเพิ่ม CSS ออกจากกัน
     * - การกำหนด style จะทำทุกครั้งที่ render
     * - การเพิ่ม CSS จะทำเพียงครั้งเดียวตอนสร้าง calendar
     */
    protected initStyleAndCss(): void {
        const { root } = this.validateRootEl()
        if (!root) return

        // นำ style ปัจจุบันไปใช้
        this.applyStyles()

        // ตรวจสอบว่าเคยเพิ่ม CSS แล้วหรือยัง ถ้ายังให้เพิ่มเพียงครั้งเดียว
        if (root.getAttribute('calendar') !== 'root') {
            // สร้าง style element และเพิ่ม CSS
            const styleCss = document.createElement('style')
            styleCss.textContent = css
            root.appendChild(styleCss)
            // ทำเครื่องหมายว่าได้เพิ่ม CSS แล้ว
            root.setAttribute('calendar', 'root')
        }
    }

    /**
     * ตรวจสอบว่าวันที่ที่เลือกอยู่ในช่วงวันที่ระหว่างหรือไม่
     * @param date
     * @param min
     * @param max
     */
    protected onCheckDisabled(date: Date, min: Date, max: Date) {
        const dateValueOf = date.valueOf()
        const minValueOf = addDate(min, -1).valueOf()
        const maxValueOf = max.valueOf()
        return dateValueOf < minValueOf || dateValueOf > maxValueOf
    }

    protected checkSameDate(a: Date, b: Date) {
        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        )
    }

    /**
     * get ค่าวันแรกและวันสุดท้ายของเดือน
     * @param date วันที่ใดๆในเดือนนั้น
     */
    protected onBeforeAfterDay(date: Date): [number, number] {
        let first_day = new Date(date.getFullYear(), date.getMonth(), 1)
        let last_day = new Date(
            date.getFullYear(),
            date.getMonth(),
            this.getMonth(date).days
        )

        return [first_day.getDay(), 7 - (last_day.getDay() + 1)] // ช่องว่างก่อนเริ่มวันที่ 1,ช่องว่างหลังสิ้นเดือน
    }

    /**
     * แปลงวันที่เป็น string
     * หาวันที่โดยเฉพาะเดือนกุมภาพันธ์
     * @param date วันที่
     */
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
     * จัดการเมื่อมีการคลิกที่ปุ่มเปลี่ยนเดือนหรือปีในขณะที่ this.calendarType คือ 'CALENDAR'
     * @param container [data-box="container"]
     */
    private onClickMonthOrYear(container: Element, type: 'YEAR' | 'MONTH') {
        this.calendarType = type
        if (type === 'MONTH') {
            const months = container.querySelector(
                '[data-box="menu-month-container"]'
            ) as HTMLDivElement
            if (months) {
                const val = String(this.ui_value.getMonth() + 1)
                Array.from(months.children).forEach((element) => {
                    const active = element.getAttribute('data-month') === val
                    element.setAttribute('attr-menu-content', String(active))
                })
            }
        } else if (type === 'YEAR') {
            this.renderUpdateYearMenu()
        }
        this.render()
    }

    /**
     * update render เนื้อหาของปฏิทินเมื่อมีการเปลี่ยนปี
     * @param typeClick ประเภทการคลิก (arrow,menu year)
     * @param year ปีที่ต้องการอัพเดท
     */
    private renderUpdateYearMenu() {
        const { rootContainer } = this.validateRootEl()
        if (!rootContainer) return
        const years = rootContainer.querySelector(
            '[data-box="menu-year-container"]'
        ) as HTMLDivElement
        if (years) {
            const { year } = this.getConfigValue()
            Array.from(years.children).forEach((element, i) => {
                const val = year + i
                const dataYear = this.year === 'en' ? val : val - 543
                element.setAttribute('attr-menu-content', String(i === 0))
                element.setAttribute('data-year', String(dataYear))
                element.innerHTML = String(val)
            })
        }
    }
    //----------------------  เกิดขึ้นครั้งเดียว Create Element    --------------------------//

    /**
     * สร้าง container และ elements ที่จำเป็นสำหรับการแสดงปฏิทิน
     * จะถูกเรียกใช้ครั้งแรกเมื่อปฏิทินถูกสร้างขึ้นเพียงครั้งเดียว
     * @param root [calendar="root"]
     */
    private createInitialContainer(root: HTMLElement) {
        if (!root) return
        this.created = true
        const container = document.createElement('div')
        container.setAttribute('data-type', this.calendarType)
        container.setAttribute('data-box', 'container')

        root.appendChild(container)

        this.makeHeader(container, 'calendar')
        this.makeWeek(container)
        this.makeDay(container)
        this.makeMenuContainer(container)
        this.makeInputEvent(container)
        // ตั้งค่า event handlers
        this.setupEventListeners()
    }

    private makeInputEvent = (container: Element) => {
        // สร้าง input hidden สำหรับรับ focus และ keyboard events
        const hiddenInput = document.createElement('input')
        hiddenInput.type = 'text'
        hiddenInput.setAttribute('aria-label', 'ควบคุมปฏิทินด้วยแป้นพิมพ์')
        hiddenInput.setAttribute('data-box', 'hidden-input')
        hiddenInput.style.cssText = `
           position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            white-space: nowrap !important;
            border: 0 !important;
            z-index: -1 !important;
            top: 0 !important;
        `
        container.appendChild(hiddenInput)

        // จัดการ focus management
        this.addEventListenerWithCleanup(container, 'click', () => {
            hiddenInput.focus()
        })

        // จัดการ keyboard events
        this.addEventListenerWithCleanup(hiddenInput, 'keydown', ((
            e: Event
        ) => {
            const keyEvent = e as KeyboardEvent

            // ป้องกันการพิมพ์และ scroll
            keyEvent.preventDefault()
            const d = this.ui_value
            let year = d.getFullYear()
            let month = d.getMonth() + 1
            const fnForArrowUpAndDown = () => {
                if (this.calendarType === 'YEAR') {
                    this.onClickMonthOrYear(container, 'YEAR')
                } else {
                    this.render()
                }
            }

            switch (keyEvent.key) {
                case 'ArrowRight':
                    this.onChangeMonth('RIGHT')
                    this.announceChange('เดือนถัดไป')
                    break
                case 'ArrowLeft':
                    this.onChangeMonth('LEFT')
                    this.announceChange('เดือนก่อนหน้า')
                    break
                case 'ArrowUp':
                    this.ui_value = new Date(`${year + 1}-${month}-01`)
                    fnForArrowUpAndDown()
                    this.announceChange('ปีถัดไป')
                    break
                case 'ArrowDown':
                    this.ui_value = new Date(`${year - 1}-${month}-01`)
                    fnForArrowUpAndDown()
                    this.announceChange('ปีก่อนหน้า')
                    break
                case 'Enter':
                    this.calendarType = 'CALENDAR'
                    this.announceChange('กลับสู่มุมมองปฏิทิน')
                    this.render()
                    break
                case 'Escape':
                    this.calendarType = 'CALENDAR'
                    this.ui_value = this.getDateValue()
                    this.announceChange('กลับไปหน้าวันที่เลือก')
                    this.render()
                    break
            }
        }) as EventListener)
    }

    // เพิ่มฟังก์ชันสำหรับประกาศการเปลี่ยนแปลงให้ screen reader
    private announceChange(message: string) {
        const announcer = document.querySelector('[role="status"]')
        if (announcer) {
            announcer.textContent = message
        }
    }

    /**
     * สร้าง elements สำหรับ header ของปฏิทิน หรือ เมนู
     * @param container [data-box="container"] || [data-box="menu-container"]
     */
    private makeHeader = (container: Element, type: 'calendar' | 'menu') => {
        const header = document.createElement('div')
        const attr = type === 'calendar' ? 'body-header' : 'menu-header'
        header.setAttribute('data-box', attr)

        const { month, year } = this.getConfigValue()

        const arrowLeft = this.createArrowButton('left')
        header.appendChild(arrowLeft)

        if (type === 'calendar') {
            const textMonth = document.createElement('div')
            textMonth.setAttribute('data-box', 'month')
            textMonth.innerHTML = `${month}`
            header.appendChild(textMonth)
        }
        const textYear = document.createElement('div')
        const yearAttr = type === 'calendar' ? 'year' : 'menu-year'
        textYear.setAttribute('data-box', yearAttr)
        textYear.innerHTML = `${year}`
        header.appendChild(textYear)
        const arrowRight = this.createArrowButton('right')
        header.appendChild(arrowRight)

        container.appendChild(header)
    }

    /**
     * สร้าง elements สำหรับแสดงวันในสัปดาห์
     */
    private makeWeek = (container: Element) => {
        const week = document.createElement('div')
        week.setAttribute('data-box', 'body-week')
        const fragment = document.createDocumentFragment()
        onWeeks(this.lang).forEach((v) => {
            const div = document.createElement('div')
            div.textContent = v
            div.setAttribute('data-box', 'week')
            fragment.appendChild(div)
        })
        week.appendChild(fragment)
        container.appendChild(week)
    }

    /**
     * สร้าง elements สำหรับแสดงวันที่
     */
    private makeDay = (container: Element) => {
        const dayBody = document.createElement('div')
        dayBody.setAttribute('data-box', 'body-day')
        // อัพเดทส่วนแสดงวันที่
        const days = this.createDays()

        // สร้าง fragment เพื่อเก็บ elements วันที่ใหม่ทั้งหมด
        const fragment = document.createDocumentFragment()
        days.children.forEach((day) => {
            // สร้าง element วันที่แต่ละวัน
            const dayElement = document.createElement('div')

            // กำหนด properties และ event handlers
            if (day.props) {
                Object.entries(day.props).forEach(([key, value]) => {
                    dayElement.setAttribute(key, value)
                })
            }

            // กำหนดข้อความวันที่
            if (typeof day.children === 'string') {
                dayElement.textContent = day.children
            }

            // เพิ่ม event handlers
            if (day.methods?.click) {
                dayElement.addEventListener('click', day.methods.click)
            }

            fragment.appendChild(dayElement)
        })

        // เพิ่ม elements วันที่ใหม่ทั้งหมดเข้าไปใน container
        dayBody.appendChild(fragment)
        container.appendChild(dayBody)
    }

    /**
     * สร้าง box elements สำหรับเมนูเลือกเดือนและปี
     * @param container [data-box="container"]
     */
    private makeMenuContainer = (container: Element) => {
        const menu = document.createElement('div')
        menu.setAttribute('data-box', 'menu-container')

        this.makeHeader(menu, 'menu')

        // Create month selector
        this.createMonthButton(menu)

        // Create year selector
        this.createYearButton(menu)

        container.appendChild(menu)
    }

    /**
     * สร้าง menu elements content สำหรับเลือกปี
     */
    private createYearButton(menu: Element) {
        const menuYear = document.createElement('div')
        menuYear.setAttribute('data-box', 'menu-year-container')
        const { year } = this.getConfigValue()

        for (let i = 0; i <= this.countYear; i++) {
            const yearBtn = document.createElement('button')
            const val = year + i
            yearBtn.textContent = String(val)
            yearBtn.setAttribute('attr-menu-content', String(i === 0))
            yearBtn.setAttribute(
                'data-year',
                String(this.year === 'en' ? val : val - 543)
            )

            menuYear.appendChild(yearBtn)
        }

        menu.appendChild(menuYear)
    }

    /**
     * สร้าง menu elements content สำหรับเลือกเดือน
     */
    private createMonthButton(menu: Element) {
        const menuMonth = document.createElement('div')
        menuMonth.setAttribute('data-box', 'menu-month-container')

        // Add months
        const months = this.getYear(this.ui_value)
        months.forEach((month) => {
            const monthBtn = document.createElement('button')
            monthBtn.textContent = month[this.lang]
            monthBtn.setAttribute('data-month', String(+month.month_value))
            monthBtn.setAttribute(
                'attr-menu-content',
                String(+month.month_value - 1 === this.ui_value.getMonth())
            )

            menuMonth.appendChild(monthBtn)
        })

        menu.appendChild(menuMonth)
    }

    /**
     * สร้าง elements สำหรับปุ่มเปลี่ยนเดือนหรือปี
     * @param direction ทิศทางของปุ่ม
     */
    private createArrowButton(direction: 'left' | 'right') {
        const button = document.createElement('button')
        button.setAttribute('data-box', 'arrow')

        button.setAttribute('data-box', 'arrow')
        const span = document.createElement('span')
        span.classList.add('calendar--arrow', direction.toLocaleLowerCase())
        button.appendChild(span)

        return button
    }
    //---------------------x   เกิดขึ้นครั้งเดียว Create Element   x-------------------------//
    //----------------------   setUpEvent   --------------------------//
    public destroyEvent() {
        // ลบ event listeners ทั้งหมด
        this.eventListeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler)
        })
        this.eventListeners = []
    }

    protected addEventListenerWithCleanup(
        element: Element,
        type: string,
        handler: EventListener
    ) {
        element.addEventListener(type, handler)
        this.eventListeners.push({ element, type, handler })
    }

    /**
     * ตั้งค่า ARIA attributes สำหรับการเข้าถึง
     */
    protected setupAccessibility(): void {
        if (!this.isClient()) return
        const { root } = this.validateRootEl()
        if (!root) return
        root.setAttribute('role', 'application')
        root.setAttribute('aria-label', 'ปฏิทิน')
        // Screen reader announcements
        this.setupScreenReaderAnnouncements()
    }

    /**
     * สร้าง element สำหรับการอ่านข้อความผ่าน screen reader
     */
    private setupScreenReaderAnnouncements() {
        const { root } = this.validateRootEl()
        if (!root) return
        const announcer = document.createElement('div')
        announcer.setAttribute('role', 'status')
        announcer.setAttribute('aria-live', 'polite')
        announcer.classList.add('sr-only') // CSS: .sr-only { visibility: hidden }
        announcer.style.display = 'none'

        root?.appendChild(announcer)
    }

    /***
     * ตั้งค่า focus ให้กับ input hidden
     */
    private initInputHidden() {
        const { rootContainer } = this.validateRootEl()
        if (!rootContainer) return
        const input = rootContainer.querySelector(
            '[data-box="hidden-input"]'
        ) as HTMLInputElement
        if (input) {
            input.focus()
        }
    }

    // เพิ่มเมธอดสำหรับตั้งค่า event handlers แบบ delegation
    private setupEventListeners() {
        const { root, rootContainer } = this.validateRootEl()
        if (!root || !rootContainer) return

        this.addEventListenerWithCleanup(root, 'click', (e) => {
            const target = e.target as HTMLElement

            // จัดการคลิกที่วันที่
            const dateTypeCalendar = target
                .closest('[role="gridcell"]')
                ?.getAttribute('aria-label')
            if (dateTypeCalendar) {
                const dateVal = new Date(dateTypeCalendar)
                this.onDatePicker(dateVal)
            }

            // จัดการคลิกที่ปุ่มเปลี่ยนปีในขณะ this.calendarType คือ 'CALENDAR'
            const yearButton = target.closest('[data-box="year"]')
            if (yearButton) {
                this.onClickMonthOrYear(rootContainer, 'YEAR')
            }

            // จัดการคลิกที่ปุ่มเปลี่ยนเดือนในขณะ this.calendarType คือ 'CALENDAR'
            const monthButton = target.closest('[data-box="month"]')
            if (monthButton) {
                this.onClickMonthOrYear(rootContainer, 'MONTH')
            }

            // จัดการคลิกที่ปุ่มเปลี่ยนเดือน
            const arrowButton = target.closest('[data-box="arrow"]')
            if (arrowButton) {
                const direction = arrowButton.querySelector('.left')
                    ? 'LEFT'
                    : 'RIGHT'
                this.onChangeMonth(direction)
            }

            // จัดการคลิกที่ปุ่มเปลี่ยนปีของ menu
            const menuYear = target.closest('[data-box="menu-year"]')
            if (menuYear) {
                this.calendarType = 'CALENDAR'
                this.render()
            }

            // จัดการคลิกที่ปุ่มเปลี่ยนเดือนของ menu
            const menuDataMonth = target
                .closest('[data-month]')
                ?.getAttribute('data-month')
            if (menuDataMonth) {
                this.ui_value = new Date(
                    `${this.ui_value.getFullYear()}-${menuDataMonth}-01`
                )
                this.calendarType = 'CALENDAR'
                this.render()
            }

            // จัดการคลิกที่ปุ่มเปลี่ยนปีของ menu
            const menuDataYear = target
                .closest('[data-year]')
                ?.getAttribute('data-year')
            if (menuDataYear) {
                this.ui_value = new Date(
                    `${menuDataYear}-${this.ui_value.getMonth() + 1}-01`
                )
                this.calendarType = 'CALENDAR'
                this.render()
            }
        })
    }
    //---------------------x   setUpEvent   x-------------------------//
}

export default main
