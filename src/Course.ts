import cheerio from 'cheerio'

type lesson = {
    url: string
    time: number
    name: string
}
type course = {
    type: string
    name: string
    creator: string
    lang: string
    imgUrl: string
    isFree: boolean
    like: number
    dislike: number
    time: number // min
    lessons: lesson[]
}

export default class CourseParser {
    rootPath = 'https://coursehunter.net'

    private $: CheerioStatic
    private json: any
    constructor(html: string) {
       this.$ = cheerio.load(html)
       this.json = JSON.parse(this.$('script[type="application/ld+json"]').html()!)[0]
    }

    get type() {
        return this.json.about.name
    }
    get name() {
        return this.json.name
    }
    get creator() {
        return this.json?.creator?.name
    }
    get lang() {
        return this.json?.inLanguage
    }
    get imgUrl() {
        const imgUrl = this.json?.image.trim()
        return this.rootPath+imgUrl
        
    }
    get isFree() {
        return this.json.isAccessibleForFree
    }
    get like() {
        return Number(this.$('.rang-text.good').text())
    }
    get dislike() {
        return Number(this.$('.rang-text.bad').text())
    }
    get time() {
        const str = this.$('i.icon-time')
            .parent()
            .parent()
            .find('.course-box-right .course-box-value')
            .text()
        const [hours, min] = str.split(':').map((el) => Number(el))
        const time = hours * 60 + min
        return time
    }
    getVideos(): lesson[] {
        const arr: lesson[] = []
        this.$('.lessons-list .lessons-item').each((_, el) => {
            const lesson: lesson = {
                url: this.$(el).find('link[itemprop=url]').attr('href')!,
                time: (() => {
                    const [hours, min] = this.$(el).find('.lessons-duration').text().split(':').map((el) => Number(el))
                    return hours * 60 + min
                })(),
                name: this.$(el).find('.lessons-name').text()
            }
            arr.push(lesson)
        })
        return arr
    }
    toJson(): course {
        return {
            type: this.type,
            name: this.name,
            creator: this.creator,
            lang: this.lang,
            imgUrl: this.imgUrl,
            isFree: this.isFree,
            like: this.like,
            dislike: this.dislike,
            time: this.time,
            lessons: this.getVideos()
        }
    }
}
