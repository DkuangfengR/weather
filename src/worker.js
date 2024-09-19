/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

function isDaytime() {
	const now = new Date();
	const hour = now.getHours();
	return hour >= 6 && hour < 18;
}

async function fetchImage(env, imgPath) {
	const response = await env.WWIB.get(imgPath);
	const arrayBuffer = await response.arrayBuffer();
	const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
	return base64String;
}

export default {
	async fetch(request, env, ctx) {
		const url = `https://api.seniverse.com/v3/weather/daily.json?key=${env.SK}&location=${request.cf.city}&language=zh-Hans&unit=c&start=0&days=3`;
		let data;
		try {
			const response = await fetch(url);
			data = await response.json();
		} catch (error) {
			console.error('Error fetching weather data:', error);
			return new Response('Error fetching weather data', { status: 500 });
		}
		const isDay = isDaytime();
		const commonImg = await fetchImage(env, "1001.gif");
		
		const currentDay = {
			img: await fetchImage(env, isDay ? "white/" + (await env.WWI.get(data.results[0].daily[0].code_day)) : "black/" + (await env.WWI.get(data.results[0].daily[0].code_night))),
			text_day: data.results[0].daily[0][isDay ? 'text_day' : 'text_night'],
			temp: `${data.results[0].daily[0].low}℃ ~${data.results[0].daily[0].high}℃`,
			location: data.results[0].location.name
		};
		const tomorrow = {
			img: await fetchImage(env, isDay ? "white/" + (await env.WWI.get(data.results[0].daily[1].code_day)) : "black/" + (await env.WWI.get(data.results[0].daily[1].code_night))),
			text_day: data.results[0].daily[1][isDay ? 'text_day' : 'text_night'],
			temp: `${data.results[0].daily[1].high}℃`
		};
		const thirdDay = {
			img: await fetchImage(env, isDay ? "white/" + (await env.WWI.get(data.results[0].daily[2].code_day)) : "black/" + (await env.WWI.get(data.results[0].daily[2].code_night))),
			text_day: data.results[0].daily[2][isDay ? 'text_day' : 'text_night'],
			temp: `${data.results[0].daily[2].high}℃`
		};
		
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="600" height="66">
			<style>
				.weather-content {
					width: 24px;
					height: 100%;
				}
				.weather-icon {
					width: 50px;
					height: 50px;
				}
		
				.weather-info {
					font-weight: bold;
					fill: #005EAC;
					font-size: 12px;
				}
			
				.temp {
					font-weight: lighter;
				}
			</style>
			<rect width="100%" height="66" fill="#F6F8FC" stroke="#E6E2ED" stroke-width="1" />
			<g transform="translate(0, 0)">
				<image class="weather-content" xlink:href="data:image/png;base64,${commonImg}" x="0" y="0"/>
			</g>
			<g transform="translate(50, 0)">
				<image class="weather-icon" xlink:href="data:image/png;base64,${currentDay.img}" x="0" y="5" />
				<text class="weather-info" x="70" y="15">${currentDay.text_day}</text>
				<text class="weather-info temp" x="70" y="35">${currentDay.temp}</text>
				<text class="weather-info" x="70" y="55" >
					<tspan font-size="14px">${currentDay.location}</tspan>
					<tspan font-weight="lighter">[今天]</tspan>
				</text>
			</g>
			<g transform="translate(250, 0)">
				<image class="weather-icon" xlink:href="data:image/png;base64,${tomorrow.img}" x="0" y="5" />
				<text class="weather-info" x="70" y="15">${tomorrow.text_day}</text>
				<text class="weather-info temp" x="70" y="35">${tomorrow.temp}</text>
				<text class="weather-info" x="70" y="55">明天</text>
			</g>
			<g transform="translate(450, 0)">
				<image class="weather-icon" xlink:href="data:image/png;base64,${thirdDay.img}" x="0" y="5" />
				<text class="weather-info" x="70" y="15">${thirdDay.text_day}</text>
				<text class="weather-info temp" x="70" y="35">${thirdDay.temp}</text>
				<text class="weather-info" x="70" y="55">后天</text>
			</g>
		</svg>`;

		return new Response(svg, {
			headers: {
				'Content-Type': 'image/svg+xml'
			}
		});
	}
};

