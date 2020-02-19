import fs from 'fs'
import fetch from 'node-fetch'
import CourseParser from './Course'

class CourseHunterApi {
	rootPath = 'https://coursehunter.net'

	async loadHtml(url: string) {
		const html = await fetch(url).then((res) => res.text())
		return html
	}

	async getPagesCnt() {
		const html = await this.loadHtml(`${this.rootPath}/archive`)
		const mathers = html.match(/https:\/\/coursehunter\.net\/archive\?page=([0-9]+)/gm)!
		const cnt = Math.max(...mathers.map((str) => Number(str.match(/[0-9]+/))))
		return cnt
	}

	async getLinks() {
		const pageCnt = await this.getPagesCnt()
		const paths = []
		for (let i = 0; i <= 2 /* pageCnt */; i++) {
			paths.push(`archive?page=${i}`)
		}
		const htmls = []
		while (paths.length) {
			const results = await Promise.all(paths.splice(0, 100).map((path) => this.loadHtml(`${this.rootPath}/${path}`)))
			htmls.push(...results)
		}
		const links:string[] = []
		for (let html of htmls) {
			let strArr = html.match(/<a href="https:\/\/coursehunter\.net\/course\/.+?"/g)!
			strArr = strArr.map((str) => str.replace(/"/g, '').replace('<a href=', ''))
			links.push(...strArr)
		}
		return links
	}
}

const api = new CourseHunterApi
api.getLinks().then(async (links) => {
	const file = []
	for (let link of links) {
		const html = await api.loadHtml(link)
		const course = new CourseParser(html)
		file.push(course.toJson())
	}
	fs.writeFileSync(`${__dirname}/data.json`, JSON.stringify(file))
})




// function delay(time: number) {
// 	return new Promise((res, rej) => {
// 		setTimeout(() => {
// 			res('ok')
// 		}, time)
// 	})
// }
// import fs from 'fs'
// const course = new CourseParser(fs.readFileSync(`${__dirname}/html.txt`, 'utf-8'))
// console.log(course.isFree)
// console.log(course.like)
// console.log(course.dislike)
// console.log(course.time)
// console.log(course.getVideos())