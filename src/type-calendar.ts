import { lists } from './data-calendar'

type Fn = (...arg: any) => void

export type Lists = typeof lists
export type StateElement = {
    tag: string
    props?: Record<string, any> | null
    children?: string | StateElement[]
    methods?: {
        click?: (...arg: any) => void
        change?: Fn
        input?: Fn
    }
    el?: HTMLElement
}

export type Style = {
    ['font-family']?: string
    text?: string
    ['text-week']?: string
    current?: string
    picker?: string
    ['text-picker']?: string
    dateRadius?: string
    disabled?: string
    background?: string
    border?: string
    borderRadius?: string
    shadow?: string
    width?: string
}

export type Box = StateElement & {
    children: StateElement[]
}
