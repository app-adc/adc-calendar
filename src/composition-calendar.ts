import { Box } from './type-calendar'

export const renderBodyDay = (daysContainer: Element, days: Box) => {
    // อัพเดทส่วนแสดงวันที่

    // ล้าง elements วันที่เดิม
    while (daysContainer.firstChild) {
        daysContainer.removeChild(daysContainer.firstChild)
    }

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
    daysContainer.appendChild(fragment)
}

/**
 * @class Calendar
 * @description คอมโพเนนต์ปฏิทินที่รองรับการเลือกวันที่แบบ Single Date และ Date Range
 * สามารถปรับแต่งภาษา (ไทย/อังกฤษ), รูปแบบปี (พ.ศ./ค.ศ.), และสไตล์การแสดงผลได้
 */

// Custom error types
class CalendarError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'CalendarError'
    }
}

export class DateValidationError extends CalendarError {
    constructor(message: string) {
        super(message)
        this.name = 'DateValidationError'
    }
}
