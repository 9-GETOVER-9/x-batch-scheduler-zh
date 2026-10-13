import { t as BRAND } from "./brand-DqqKBS9W.js";
//#region variations/x/platform.js
var X_BASE = "https://x.com";
var UPLOAD_BASE = "https://upload.x.com";
var BEARER_TOKEN = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
var GRAPHQL_CREATE_SCHEDULED = `${X_BASE}/i/api/graphql/LCVzRQGxOaGnOnYH01NQXg/CreateScheduledTweet`;
function getCookie(name) {
	return new Promise((resolve) => {
		chrome.cookies.get({
			url: X_BASE,
			name
		}, (c) => resolve(c ? c.value : null));
	});
}
var PLATFORM$1 = {
	id: "x",
	name: "X 批量排期",
	shortName: "X",
	domain: X_BASE,
	profileUrl: X_BASE,
	maxChars: 280,
	features: {
		randomMode: true,
		csvUpload: true,
		imageUpload: true,
		imageProcessing: true,
		removeMetadata: true,
		randomVariations: true,
		cropRatios: true,
		colorAdjustments: true,
		horizontalFlip: true,
		startImmediately: false,
		batches: true
	},
	async checkAuth() {
		const ct0 = await getCookie("ct0");
		if (!ct0) return null;
		if (!await getCookie("auth_token")) return null;
		return { ct0 };
	},
	async uploadImage(file) {
		const ct0 = await getCookie("ct0");
		if (!ct0) throw new Error("尚未登录 X（缺少 ct0 Cookie）");
		const headers = {
			authorization: BEARER_TOKEN,
			"x-csrf-token": ct0,
			"x-twitter-auth-type": "OAuth2Session"
		};
		const initUrl = `${UPLOAD_BASE}/i/media/upload.json?command=INIT&total_bytes=${file.size}&media_type=${encodeURIComponent(file.type || "image/jpeg")}&media_category=tweet_image`;
		const initRes = await fetch(initUrl, {
			method: "POST",
			credentials: "include",
			headers
		});
		if (!initRes.ok) throw new Error(`初始化图片上传失败：HTTP ${initRes.status}`);
		const { media_id_string: mediaId } = await initRes.json();
		if (!mediaId) throw new Error("图片上传初始化成功，但未返回媒体 ID");
		const appendUrl = `${UPLOAD_BASE}/i/media/upload.json?command=APPEND&media_id=${mediaId}&segment_index=0`;
		const formData = new FormData();
		formData.append("media", file, file.name);
		const appendRes = await fetch(appendUrl, {
			method: "POST",
			credentials: "include",
			headers,
			body: formData
		});
		if (!appendRes.ok && appendRes.status !== 204) throw new Error(`上传图片数据失败：HTTP ${appendRes.status}`);
		const finalizeUrl = `${UPLOAD_BASE}/i/media/upload.json?command=FINALIZE&media_id=${mediaId}`;
		const finalizeRes = await fetch(finalizeUrl, {
			method: "POST",
			credentials: "include",
			headers
		});
		if (!finalizeRes.ok) throw new Error(`完成图片上传失败：HTTP ${finalizeRes.status}`);
		const finalizeData = await finalizeRes.json();
		if (finalizeData.processing_info) await pollProcessing(mediaId, ct0, finalizeData.processing_info);
		return mediaId;
	},
	async createDraft(text, uploadIds) {
		return JSON.stringify({
			text,
			mediaIds: uploadIds
		});
	},
	async scheduleDraft(draftId, publishTime) {
		const { text, mediaIds } = JSON.parse(draftId);
		const ct0 = await getCookie("ct0");
		if (!ct0) throw new Error("尚未登录 X（缺少 ct0 Cookie）");
		const res = await fetch(GRAPHQL_CREATE_SCHEDULED, {
			method: "POST",
			credentials: "include",
			headers: {
				"content-type": "application/json",
				authorization: BEARER_TOKEN,
				"x-csrf-token": ct0,
				"x-twitter-auth-type": "OAuth2Session",
				"x-twitter-active-user": "yes",
				"x-twitter-client-language": "en"
			},
			body: JSON.stringify({
				variables: {
					post_tweet_request: {
						auto_populate_reply_metadata: false,
						status: text,
						exclude_reply_user_ids: [],
						media_ids: mediaIds || []
					},
					execute_at: publishTime
				},
				features: {
					c9s_tweet_anatomy_moderator_badge_enabled: true,
					responsive_web_home_pinned_timelines_enabled: true,
					blue_business_profile_image_shape_enabled: true,
					creator_subscriptions_tweet_preview_api_enabled: true,
					freedom_of_speech_not_reach_fetch_enabled: true,
					graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
					graphql_timeline_v2_bookmark_timeline: true,
					hidden_profile_likes_enabled: true,
					highlights_tweets_tab_ui_enabled: true,
					interactive_text_enabled: true,
					longform_notetweets_consumption_enabled: true,
					longform_notetweets_inline_media_enabled: true,
					longform_notetweets_rich_text_read_enabled: true,
					longform_notetweets_richtext_consumption_enabled: true,
					profile_foundations_tweet_stats_enabled: true,
					profile_foundations_tweet_stats_tweet_frequency: true,
					responsive_web_birdwatch_note_limit_enabled: true,
					responsive_web_edit_tweet_api_enabled: true,
					responsive_web_enhance_cards_enabled: false,
					responsive_web_graphql_exclude_directive_enabled: true,
					responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
					responsive_web_graphql_timeline_navigation_enabled: true,
					responsive_web_media_download_video_enabled: false,
					responsive_web_text_conversations_enabled: false,
					responsive_web_twitter_article_data_v2_enabled: true,
					responsive_web_twitter_article_tweet_consumption_enabled: false,
					responsive_web_twitter_blue_verified_badge_is_enabled: true,
					rweb_lists_timeline_redesign_enabled: true,
					spaces_2022_h2_clipping: true,
					spaces_2022_h2_spaces_communities: true,
					standardized_nudges_misinfo: true,
					subscriptions_verification_info_verified_since_enabled: true,
					tweet_awards_web_tipping_enabled: false,
					tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
					tweetypie_unmention_optimization_enabled: true,
					verified_phone_label_enabled: false,
					vibe_api_enabled: true,
					view_counts_everywhere_api_enabled: true
				},
				queryId: "LCVzRQGxOaGnOnYH01NQXg"
			})
		});
		if (!res.ok) {
			const errText = await res.text().catch(() => "");
			throw new Error(`创建排期失败：HTTP ${res.status} ${errText.slice(0, 300)}`);
		}
		const data = await res.json();
		if (data.errors?.length > 0) throw new Error(`X 接口错误： ${data.errors[0].message || JSON.stringify(data.errors[0]).slice(0, 300)}`);
		return true;
	}
};
async function pollProcessing(mediaId, ct0, processingInfo) {
	let state = processingInfo.state;
	let checkAfter = processingInfo.check_after_secs || 1;
	let attempts = 0;
	while (state === "pending" || state === "in_progress") {
		if (attempts++ >= 30) throw new Error("图片处理超时");
		await new Promise((r) => setTimeout(r, checkAfter * 1e3));
		const res = await fetch(`${UPLOAD_BASE}/i/media/upload.json?command=STATUS&media_id=${mediaId}`, {
			method: "GET",
			credentials: "include",
			headers: {
				authorization: BEARER_TOKEN,
				"x-csrf-token": ct0,
				"x-twitter-auth-type": "OAuth2Session"
			}
		});
		if (!res.ok) throw new Error(`查询图片处理状态失败：HTTP ${res.status}`);
		const data = await res.json();
		if (!data.processing_info) break;
		state = data.processing_info.state;
		checkAfter = data.processing_info.check_after_secs || 1;
		if (state === "failed") throw new Error(`图片处理失败： ${JSON.stringify(data.processing_info.error || {})}`);
	}
}
window.PLATFORM = PLATFORM$1;
//#endregion
//#region shared/core.js
function showToast(message, type = "error") {
	document.querySelector(".toast-notification")?.remove();
	const toast = document.createElement("div");
	toast.className = "toast-notification";
	const colors = {
		error: "bg-th-error/15 border-th-error/30 text-th-error",
		warning: "bg-th-warning/15 border-th-warning/30 text-th-warning",
		success: "bg-th-success/15 border-th-success/30 text-th-success",
		info: "bg-white/10 border-white/20 text-white"
	};
	toast.className = `toast-notification fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] ${colors[type] || colors.error} border rounded-xl px-5 py-3 text-sm shadow-lg backdrop-blur-sm transition-all duration-300`;
	toast.style.opacity = "0";
	toast.style.transform = "translate(-50%, 12px)";
	toast.textContent = message;
	document.body.appendChild(toast);
	requestAnimationFrame(() => {
		toast.style.opacity = "1";
		toast.style.transform = "translate(-50%, 0)";
	});
	setTimeout(() => {
		toast.style.opacity = "0";
		toast.style.transform = "translate(-50%, 12px)";
		setTimeout(() => toast.remove(), 300);
	}, 4e3);
}
var parsedPosts = [];
var imageFiles = /* @__PURE__ */ new Map();
var currentMode = "manual";
var imageProcessingSettings = {
	removeMetadata: false,
	randomVariations: false,
	cropRatios: ["original"],
	saturationRange: [-10, 10],
	brightnessRange: [-10, 10],
	contrastRange: [-10, 10],
	horizontalFlip: false
};
var CROP_RATIOS = {
	original: null,
	"1:1": 1,
	"4:5": 4 / 5,
	"5:4": 5 / 4,
	"16:9": 16 / 9,
	"9:16": 9 / 16
};
var inputSection = document.getElementById("input-section");
var previewSection = document.getElementById("preview-section");
var progressSection = document.getElementById("progress-section");
var postsList = document.getElementById("posts-list");
var resultsList = document.getElementById("results-list");
var postCount = document.getElementById("post-count");
var scheduleAllBtn = document.getElementById("schedule-all-btn");
var backBtn = document.getElementById("back-btn");
var progressBar = document.getElementById("progress-bar");
var progressText = document.getElementById("progress-text");
var doneActions = document.getElementById("done-actions");
var newBatchBtn = document.getElementById("new-batch-btn");
var authStatus = document.getElementById("auth-status");
var startDatetime = document.getElementById("start-datetime");
var intervalValue = document.getElementById("interval-value");
var intervalUnit = document.getElementById("interval-unit");
var timezoneSelect = document.getElementById("timezone");
var parseBtn = document.getElementById("parse-btn");
var clearBtn = document.getElementById("clear-btn");
var startNowCheckbox = document.getElementById("start-now");
var saveBatchBtn = document.getElementById("save-batch-btn");
var batchSelect = document.getElementById("batch-select");
var batchSelectWrapper = document.getElementById("batch-select-wrapper");
var deleteBatchBtn = document.getElementById("delete-batch-btn");
var randomizeTimeCheckbox = document.getElementById("randomize-time");
var modeSpreadsheet = document.getElementById("mode-spreadsheet");
var modeRandom = document.getElementById("mode-random");
var modeManual = document.getElementById("mode-manual");
var spreadsheetSection = document.getElementById("spreadsheet-mode");
var randomSection = document.getElementById("random-mode");
var manualSection = document.getElementById("manual-mode");
var csvDropzone = document.getElementById("csv-dropzone");
var csvFileInput = document.getElementById("csv-file");
var csvFilename = document.getElementById("csv-filename");
var imagesDropzone = document.getElementById("images-dropzone");
var imageFilesInput = document.getElementById("image-files");
var imagesCount = document.getElementById("images-count");
var imagesPreview = document.getElementById("images-preview");
var randomImagesDropzone = document.getElementById("random-images-dropzone");
var randomImageFilesInput = document.getElementById("random-image-files");
var randomImagesCount = document.getElementById("random-images-count");
var randomImagesPreview = document.getElementById("random-images-preview");
var captionsInput = document.getElementById("captions-input");
var numPostsInput = document.getElementById("num-posts");
var manualRowsContainer = document.getElementById("manual-rows");
var manualAddRowBtn = document.getElementById("manual-add-row");
var manualRows = [];
var manualRowIdCounter = 0;
var csvData = null;
var csvHasTimestamps = false;
var scheduleOptions = document.getElementById("schedule-options");
var csvTimestampsNotice = document.getElementById("csv-timestamps-notice");
document.addEventListener("DOMContentLoaded", () => {
	applyPlatformConfig();
	initTimezoneSelect();
	setDefaultStartDatetime();
	checkAuth();
	bindEvents();
	refreshBatchDropdown();
});
function applyPlatformConfig() {
	document.title = PLATFORM.name;
	const headerTitle = document.querySelector("#header-title");
	if (headerTitle) headerTitle.textContent = PLATFORM.name;
	if (PLATFORM.brandColor) document.documentElement.style.setProperty("--color-brand", PLATFORM.brandColor);
	const features = PLATFORM.features;
	if (!features.randomMode) modeRandom?.parentElement?.classList.add("hidden");
	if (!features.imageProcessing) document.getElementById("image-processing-options")?.classList.add("hidden");
	if (!features.imageUpload) {
		imagesDropzone?.parentElement?.classList.add("hidden");
		randomImagesDropzone?.parentElement?.classList.add("hidden");
	}
	const platformLink = document.querySelector("#open-platform-link");
	if (platformLink) {
		platformLink.href = PLATFORM.domain;
		platformLink.textContent = `打开 ${PLATFORM.shortName} →`;
	}
}
function initTimezoneSelect() {
	const userZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const majorZones = [
		"Pacific/Honolulu",
		"America/Anchorage",
		"America/Los_Angeles",
		"America/Denver",
		"America/Chicago",
		"America/New_York",
		"America/Halifax",
		"America/Sao_Paulo",
		"Atlantic/Cape_Verde",
		"Europe/London",
		"Europe/Paris",
		"Europe/Helsinki",
		"Europe/Moscow",
		"Asia/Dubai",
		"Asia/Karachi",
		"Asia/Kolkata",
		"Asia/Dhaka",
		"Asia/Bangkok",
		"Asia/Shanghai",
		"Asia/Tokyo",
		"Asia/Seoul",
		"Australia/Sydney",
		"Pacific/Auckland"
	];
	if (!majorZones.includes(userZone)) majorZones.push(userZone);
	const now = /* @__PURE__ */ new Date();
	const entries = majorZones.map((tz) => {
		const offsetPart = new Intl.DateTimeFormat("en-US", {
			timeZone: tz,
			timeZoneName: "shortOffset"
		}).formatToParts(now).find((p) => p.type === "timeZoneName");
		const offset = offsetPart ? offsetPart.value : "";
		const match = offset.match(/GMT([+-]?\d+(?::\d+)?)/);
		let numericOffset = 0;
		if (match) {
			const [h, m] = (match[1] || "0").split(":").map(Number);
			numericOffset = h + (m || 0) / 60;
		}
		return {
			tz,
			label: `(${offset}) ${tz.replace(/_/g, " ").split("/").pop()}`,
			numericOffset
		};
	});
	entries.sort((a, b) => a.numericOffset - b.numericOffset);
	const seen = /* @__PURE__ */ new Set();
	entries.forEach(({ tz, label }) => {
		if (seen.has(label)) return;
		seen.add(label);
		const opt = document.createElement("option");
		opt.value = tz;
		opt.textContent = label;
		if (tz === userZone) opt.selected = true;
		timezoneSelect.appendChild(opt);
	});
}
function setDefaultStartDatetime() {
	const tomorrow = /* @__PURE__ */ new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	tomorrow.setHours(9, 0, 0, 0);
	startDatetime.value = (/* @__PURE__ */ new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 6e4)).toISOString().slice(0, 16);
}
function setStartToNow() {
	const now = /* @__PURE__ */ new Date();
	now.setMinutes(now.getMinutes() + 2);
	startDatetime.value = (/* @__PURE__ */ new Date(now.getTime() - now.getTimezoneOffset() * 6e4)).toISOString().slice(0, 16);
}
async function checkAuth() {
	try {
		if (await PLATFORM.checkAuth()) authStatus.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-th-success pulse-dot"></span>
        <span class="text-th-success">已连接 ${PLATFORM.shortName}</span>
      `;
		else showAuthError();
	} catch {
		showAuthError();
	}
}
function showAuthError() {
	authStatus.innerHTML = `
    <span class="w-2 h-2 rounded-full bg-th-error"></span>
    <span class="text-th-error">尚未登录 ${PLATFORM.shortName}</span>
    <a href="${PLATFORM.domain}" target="_blank" class="text-white/70 hover:text-white ml-1">前往登录 &rarr;</a>
  `;
}
function bindEvents() {
	modeSpreadsheet.addEventListener("click", () => switchMode("spreadsheet"));
	modeRandom.addEventListener("click", () => switchMode("random"));
	if (modeManual) modeManual.addEventListener("click", () => switchMode("manual"));
	parseBtn.addEventListener("click", handleParse);
	clearBtn.addEventListener("click", handleClear);
	scheduleAllBtn.addEventListener("click", handleScheduleAll);
	backBtn.addEventListener("click", handleBack);
	newBatchBtn.addEventListener("click", handleNewBatch);
	startNowCheckbox.addEventListener("change", (e) => {
		if (e.target.checked) {
			setStartToNow();
			startDatetime.disabled = true;
		} else startDatetime.disabled = false;
	});
	const imgProcToggle = document.getElementById("image-processing-toggle");
	const imgProcBody = document.getElementById("image-processing-body");
	const imgProcChevron = document.getElementById("image-processing-chevron");
	if (imgProcToggle && imgProcBody) imgProcToggle.addEventListener("click", () => {
		const isHidden = imgProcBody.classList.toggle("hidden");
		imgProcChevron?.classList.toggle("rotate-180", !isHidden);
	});
	const removeMetadataEl = document.getElementById("remove-metadata");
	const randomVariationsEl = document.getElementById("random-variations");
	const horizontalFlipEl = document.getElementById("horizontal-flip");
	if (removeMetadataEl) removeMetadataEl.addEventListener("change", (e) => {
		imageProcessingSettings.removeMetadata = e.target.checked;
	});
	if (randomVariationsEl) randomVariationsEl.addEventListener("change", (e) => {
		imageProcessingSettings.randomVariations = e.target.checked;
		document.getElementById("variation-controls").classList.toggle("hidden", !e.target.checked);
	});
	if (horizontalFlipEl) horizontalFlipEl.addEventListener("change", (e) => {
		imageProcessingSettings.horizontalFlip = e.target.checked;
	});
	document.querySelectorAll(".crop-ratio-btn").forEach((btn) => {
		btn.addEventListener("click", () => {
			btn.classList.toggle("active");
			imageProcessingSettings.cropRatios = Array.from(document.querySelectorAll(".crop-ratio-btn.active")).map((el) => el.dataset.ratio);
		});
	});
	[
		"sat",
		"bright",
		"contrast"
	].forEach((prefix) => {
		const minEl = document.getElementById(`${prefix}-min`);
		const maxEl = document.getElementById(`${prefix}-max`);
		const labelEl = document.getElementById(`${prefix}-range-label`);
		const enabledEl = document.getElementById(`${prefix}-enabled`);
		if (!minEl || !maxEl || !labelEl || !enabledEl) return;
		const key = prefix === "sat" ? "saturationRange" : prefix === "bright" ? "brightnessRange" : "contrastRange";
		const update = () => {
			if (enabledEl.checked) {
				imageProcessingSettings[key] = [parseInt(minEl.value), parseInt(maxEl.value)];
				labelEl.textContent = `${minEl.value}% 至 +${maxEl.value}%`;
			} else {
				imageProcessingSettings[key] = [0, 0];
				labelEl.textContent = "已关闭";
			}
		};
		minEl.addEventListener("input", update);
		maxEl.addEventListener("input", update);
		enabledEl.addEventListener("change", update);
	});
	const downloadExampleCsvBtn = document.getElementById("download-example-csv");
	if (downloadExampleCsvBtn) downloadExampleCsvBtn.addEventListener("click", downloadExampleCsv);
	saveBatchBtn.addEventListener("click", handleSaveBatch);
	batchSelect.addEventListener("change", handleBatchSelectChange);
	deleteBatchBtn.addEventListener("click", handleDeleteBatch);
	csvDropzone.addEventListener("click", () => csvFileInput.click());
	csvDropzone.addEventListener("dragover", (e) => {
		e.preventDefault();
		csvDropzone.classList.add("drag-over");
	});
	csvDropzone.addEventListener("dragleave", () => csvDropzone.classList.remove("drag-over"));
	csvDropzone.addEventListener("drop", (e) => {
		e.preventDefault();
		csvDropzone.classList.remove("drag-over");
		const file = e.dataTransfer.files[0];
		if (file && (file.name.endsWith(".csv") || file.name.endsWith(".txt"))) handleCSVFile(file);
	});
	csvFileInput.addEventListener("change", (e) => {
		if (e.target.files[0]) handleCSVFile(e.target.files[0]);
	});
	imagesDropzone.addEventListener("click", () => imageFilesInput.click());
	imagesDropzone.addEventListener("dragover", (e) => {
		e.preventDefault();
		imagesDropzone.classList.add("drag-over");
	});
	imagesDropzone.addEventListener("dragleave", () => imagesDropzone.classList.remove("drag-over"));
	imagesDropzone.addEventListener("drop", (e) => {
		e.preventDefault();
		imagesDropzone.classList.remove("drag-over");
		handleImageFiles(e.dataTransfer.files, "spreadsheet");
	});
	imageFilesInput.addEventListener("change", (e) => handleImageFiles(e.target.files, "spreadsheet"));
	randomImagesDropzone.addEventListener("click", () => randomImageFilesInput.click());
	randomImagesDropzone.addEventListener("dragover", (e) => {
		e.preventDefault();
		randomImagesDropzone.classList.add("drag-over");
	});
	randomImagesDropzone.addEventListener("dragleave", () => randomImagesDropzone.classList.remove("drag-over"));
	randomImagesDropzone.addEventListener("drop", (e) => {
		e.preventDefault();
		randomImagesDropzone.classList.remove("drag-over");
		handleImageFiles(e.dataTransfer.files, "random");
	});
	randomImageFilesInput.addEventListener("change", (e) => handleImageFiles(e.target.files, "random"));
	if (manualAddRowBtn) {
		manualAddRowBtn.addEventListener("click", () => addManualRow());
		addManualRow();
	}
}
function switchMode(mode) {
	currentMode = mode;
	if (modeManual) modeManual.classList.toggle("active", mode === "manual");
	modeSpreadsheet.classList.toggle("active", mode === "spreadsheet");
	modeRandom.classList.toggle("active", mode === "random");
	if (manualSection) manualSection.classList.toggle("hidden", mode !== "manual");
	spreadsheetSection.classList.toggle("hidden", mode !== "spreadsheet");
	randomSection.classList.toggle("hidden", mode !== "random");
	updateScheduleVisibility();
}
function handleCSVFile(file) {
	const reader = new FileReader();
	reader.onload = (e) => {
		csvData = e.target.result;
		csvFilename.textContent = file.name;
		csvFilename.classList.remove("hidden");
		detectCsvTimestamps(csvData);
	};
	reader.readAsText(file);
}
function detectCsvTimestamps(data) {
	const dataRows = parseCsvRows(data).filter((parts) => {
		const first = (parts[0] || "").trim();
		return first && !/^(caption|text|content|message)/i.test(first);
	});
	if (dataRows.length === 0) {
		csvHasTimestamps = false;
		updateScheduleVisibility();
		return;
	}
	let timestampCount = 0;
	for (const parts of dataRows) if (parts.length >= 3) {
		const candidate = (parts[2] || "").trim();
		if (candidate && !isNaN(new Date(candidate).getTime())) timestampCount++;
	}
	csvHasTimestamps = timestampCount > 0 && timestampCount >= dataRows.length * .5;
	updateScheduleVisibility();
}
function updateScheduleVisibility() {
	if (currentMode === "spreadsheet" && csvHasTimestamps) {
		scheduleOptions?.classList.add("hidden");
		csvTimestampsNotice?.classList.remove("hidden");
	} else {
		scheduleOptions?.classList.remove("hidden");
		csvTimestampsNotice?.classList.add("hidden");
	}
}
var EXAMPLE_CSV_ROWS = {
	threads: [
		["just another day in paradise", "beach.jpg"],
		["coffee first, questions later", "coffee.jpg"],
		["golden hour hits different", "sunset.jpg"],
		["exploring the city one block at a time", "street.jpg"],
		["the view from up here > everything", "rooftop.jpg"],
		["Sunday reset. New week, new energy.", "morning.jpg"],
		["no filter needed when the lighting is this good", "portrait.jpg"],
		["lost in the right direction", "travel.jpg"],
		["vibes are immaculate today", "vibes.jpg"],
		["plot twist: it all worked out", "happy.jpg"]
	],
	onlyfans: [
		["new set just dropped... check your DMs for the full thing", "set1.jpg"],
		["feeling myself today. like & comment for more", "selfie.jpg"],
		["exclusive BTS from yesterday's shoot", "bts.jpg"],
		["POV: you just opened the best post on your feed", "pov.jpg"],
		["just uploaded something special for my top fans", "exclusive.jpg"],
		["good morning to my subscribers only", "morning.jpg"],
		["this one almost didn't make the cut... glad it did", "outtake.jpg"],
		["surprise drop. you're welcome.", "surprise.jpg"],
		["rate this 1-10 in the comments", "rate.jpg"],
		["if this gets 50 likes I'll post the rest of the set", "teaser.jpg"]
	],
	fanvue: [
		["new exclusive content just for you", "exclusive1.jpg"],
		["behind the scenes from today's session", "bts.jpg"],
		["happy Friday! here's a little treat", "friday.jpg"],
		["just uploaded a full set in my vault - go check it out", "vault.jpg"],
		["your support means everything. here's a thank you", "thankyou.jpg"],
		["good morning! starting the day right", "morning.jpg"],
		["sneak peek of what's coming this week", "preview.jpg"],
		["this or that? comment below", "poll.jpg"],
		["weekend vibes only", "weekend.jpg"],
		["new week, new content. let's go", "monday.jpg"]
	],
	youtube: [
		["What topics do you want me to cover next? Drop your ideas below!", "question.jpg"],
		["New video is LIVE! Link in the description. Let me know what you think", "newvideo.jpg"],
		["Behind the scenes of my latest project. It's been a journey", "bts.jpg"],
		["Hot take: quality > quantity. Agree or disagree?", "hottake.jpg"],
		["Thank you for 10K subscribers! Giveaway coming soon", "milestone.jpg"],
		["Just hit record on something big. Stay tuned this week", "teaser.jpg"],
		["What's your unpopular opinion about this topic? I'll react to the best ones", "react.jpg"],
		["POV: the algorithm finally recommended something good", "meme.jpg"],
		["This community is incredible. Here's a sneak peek just for you", "community.jpg"],
		["Caption this photo. Best one gets pinned!", "caption.jpg"]
	],
	x: [
		["刚完成一个新项目，明天分享更多细节。", "launch.jpg"],
		["一个想法：有些效率建议，其实是拖延的另一种形式。", "hottake.jpg"],
		["今天的互联网又带来了惊喜。", "meme.jpg"],
		["准备分享这周学到的东西。", "thread.jpg"],
		["公开记录创作过程，让交流更有意思。", "build.jpg"],
		["你觉得持续行动和天赋，哪个更重要？", "opinion.jpg"],
		["这条帖子可能会引发讨论。", "spicy.jpg"],
		["早晨的咖啡，配上一段专注工作的时间。", "morning.jpg"],
		["好奇问问：你现在正在做什么项目？", "question.jpg"],
		["先收藏这条，之后可能会用到。", "tip.jpg"]
	]
};
function downloadExampleCsv() {
	const dataRows = EXAMPLE_CSV_ROWS[PLATFORM.id] || EXAMPLE_CSV_ROWS.threads;
	const today = /* @__PURE__ */ new Date();
	today.setHours(10, 0, 0, 0);
	const csv = [[
		"caption",
		"image_filename",
		"datetime"
	], ...dataRows.map((row, i) => {
		const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1e3);
		const ts = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} 10:00:00`;
		return [...row, ts];
	})].map((row) => row.map((cell) => `"${cell.replace(/"/g, "\"\"")}"`).join(",")).join("\n");
	const blob = new Blob([csv], { type: "text/csv" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${PLATFORM.id}-example.csv`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
function parseCsvRows(text) {
	const rows = [];
	let current = "";
	let inQuotes = false;
	const fields = [];
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (inQuotes) if (ch === "\"") if (i + 1 < text.length && text[i + 1] === "\"") {
			current += "\"";
			i++;
		} else inQuotes = false;
		else current += ch;
		else if (ch === "\"") inQuotes = true;
		else if (ch === ",") {
			fields.push(current);
			current = "";
		} else if (ch === "\n" || ch === "\r") {
			if (ch === "\r" && i + 1 < text.length && text[i + 1] === "\n") i++;
			fields.push(current);
			current = "";
			rows.push(fields.slice());
			fields.length = 0;
		} else current += ch;
	}
	if (current || fields.length > 0) {
		fields.push(current);
		rows.push(fields.slice());
	}
	return rows;
}
function handleImageFiles(files, mode) {
	Array.from(files).filter((f) => f.type.startsWith("image/")).forEach((f) => imageFiles.set(f.name, f));
	renderImagePreviews(mode);
}
function addManualRow(text = "", imageFile = null) {
	const row = {
		id: manualRowIdCounter++,
		text,
		imageFile
	};
	manualRows.push(row);
	renderManualRow(row);
}
function renderManualRow(row) {
	const el = document.createElement("div");
	el.className = "manual-row bg-th-card border border-th-border rounded-xl p-4 flex gap-3 items-start";
	el.dataset.rowId = row.id;
	el.innerHTML = `
    <input type="file" accept="image/*" class="hidden manual-row-file-input">
    ${row.imageFile ? `<img src="${URL.createObjectURL(row.imageFile)}" class="image-thumb shrink-0" alt="">` : `<div class="manual-img-placeholder w-16 h-16 shrink-0 rounded-lg border border-dashed border-th-border flex items-center justify-center cursor-pointer hover:border-white/40 transition-colors" title="添加图片（可选）">
        <svg class="w-5 h-5 text-th-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
      </div>`}
    <textarea rows="3" class="manual-row-text flex-1 bg-transparent text-white text-sm leading-relaxed p-2 rounded-lg resize-none border border-th-border focus:border-white/30 outline-none" placeholder="输入帖子正文…">${escapeHtml(row.text)}</textarea>
    <button class="manual-row-remove text-th-gray hover:text-th-error transition-colors shrink-0 p-1 cursor-pointer" title="删除">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>
  `;
	const textarea = el.querySelector(".manual-row-text");
	textarea.addEventListener("input", () => {
		row.text = textarea.value;
	});
	const fileInput = el.querySelector(".manual-row-file-input");
	const imgArea = el.querySelector(".manual-img-placeholder, .image-thumb");
	if (imgArea) {
		imgArea.style.cursor = "pointer";
		imgArea.addEventListener("click", () => fileInput.click());
	}
	fileInput.addEventListener("change", (e) => {
		const file = e.target.files[0];
		if (!file || !file.type.startsWith("image/")) return;
		row.imageFile = file;
		const parent = el.parentElement;
		const next = el.nextSibling;
		el.remove();
		renderManualRowAt(row, parent, next);
	});
	el.querySelector(".manual-row-remove").addEventListener("click", () => {
		manualRows = manualRows.filter((r) => r.id !== row.id);
		el.remove();
		if (manualRows.length === 0) addManualRow();
	});
	manualRowsContainer.appendChild(el);
}
function renderManualRowAt(row, container, beforeNode) {
	const el = document.createElement("div");
	manualRowsContainer.appendChild(el);
	el.remove();
	const tmpContainer = manualRowsContainer;
	renderManualRow(row);
	const rendered = tmpContainer.lastElementChild;
	if (beforeNode) container.insertBefore(rendered, beforeNode);
}
function renderImagePreviews(mode) {
	const countEl = mode === "spreadsheet" ? imagesCount : randomImagesCount;
	const previewEl = mode === "spreadsheet" ? imagesPreview : randomImagesPreview;
	if (imageFiles.size === 0) {
		countEl.classList.add("hidden");
		previewEl.classList.add("hidden");
		previewEl.innerHTML = "";
		return;
	}
	countEl.textContent = `已载入 ${imageFiles.size} 张图片`;
	countEl.classList.remove("hidden");
	previewEl.innerHTML = "";
	previewEl.classList.remove("hidden");
	imageFiles.forEach((file, name) => {
		const wrapper = document.createElement("div");
		wrapper.className = "upload-thumb-wrapper";
		wrapper.title = name;
		const img = document.createElement("img");
		img.src = URL.createObjectURL(file);
		img.alt = name;
		const removeBtn = document.createElement("span");
		removeBtn.className = "remove-img";
		removeBtn.textContent = "×";
		removeBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			imageFiles.delete(name);
			URL.revokeObjectURL(img.src);
			renderImagePreviews(mode);
		});
		wrapper.appendChild(img);
		wrapper.appendChild(removeBtn);
		previewEl.appendChild(wrapper);
	});
}
async function handleParse() {
	if (currentMode === "spreadsheet") parsedPosts = parseSpreadsheet();
	else if (currentMode === "manual") parsedPosts = parseManual();
	else parsedPosts = parseRandom();
	if (parsedPosts.length === 0) return;
	const shouldProcess = imageProcessingSettings.removeMetadata || imageProcessingSettings.randomVariations;
	const postsWithImages = parsedPosts.filter((p) => p.imageFile);
	if (shouldProcess && postsWithImages.length > 0) {
		inputSection.classList.add("hidden");
		previewSection.classList.remove("hidden");
		progressSection.classList.add("hidden");
		postCount.textContent = parsedPosts.length;
		postsList.innerHTML = `<div class="text-center py-8 text-th-gray"><p class="text-sm mb-2">正在处理 ${postsWithImages.length} 张图片…</p><p class="text-xs">正在应用图片变化并移除元数据</p></div>`;
		for (const post of postsWithImages) try {
			const processed = await processImageForUpload(post.imageFile, imageProcessingSettings);
			post.processedFile = processed;
			post.processedThumbUrl = URL.createObjectURL(processed);
		} catch (err) {
			console.error("Image processing failed for", post.imageName, err);
			post.processedFile = null;
			post.processedThumbUrl = null;
		}
	}
	renderPreview();
	inputSection.classList.add("hidden");
	previewSection.classList.remove("hidden");
	progressSection.classList.add("hidden");
}
function parseSpreadsheet() {
	if (!csvData) {
		showToast("请先上传 CSV 文件。");
		return [];
	}
	const rows = parseCsvRows(csvData);
	const posts = [];
	const startStr = startDatetime.value;
	const intervalMinutes = parseInt(intervalValue.value, 10) * parseInt(intervalUnit.value, 10);
	const shouldRandomize = randomizeTimeCheckbox && randomizeTimeCheckbox.checked;
	let current = new Date(startStr);
	if (isNaN(current.getTime())) {
		current = /* @__PURE__ */ new Date();
		current.setDate(current.getDate() + 1);
		current.setHours(9, 0, 0, 0);
	}
	function advanceTime() {
		const baseMs = intervalMinutes * 60 * 1e3;
		if (shouldRandomize) {
			const jitter = baseMs * (.7 + Math.random() * .6);
			current = new Date(current.getTime() + jitter);
		} else current = new Date(current.getTime() + baseMs);
	}
	for (const parts of rows) {
		const firstField = (parts[0] || "").trim();
		if (!firstField) continue;
		if (/^(caption|text|content|message)/i.test(firstField)) continue;
		const caption = firstField.replace(/\\n/g, "\n");
		if (!caption) continue;
		const filename = (parts[1] || "").trim();
		const file = filename ? imageFiles.get(filename) || null : null;
		const thumbUrl = file ? URL.createObjectURL(file) : null;
		let scheduledAt;
		if (csvHasTimestamps && parts.length >= 3) {
			const tsCandidate = (parts[2] || "").trim();
			const parsed = new Date(tsCandidate);
			if (!isNaN(parsed.getTime())) scheduledAt = parsed;
			else {
				scheduledAt = new Date(current);
				advanceTime();
			}
		} else {
			scheduledAt = new Date(current);
			advanceTime();
		}
		posts.push({
			text: caption,
			imageName: filename || null,
			imageFile: file,
			imageThumbUrl: thumbUrl,
			scheduledAt,
			status: "pending"
		});
	}
	if (posts.length === 0) showToast("CSV 中没有找到帖子，请检查格式。");
	return posts;
}
function parseRandom() {
	const captions = captionsInput.value.split("\n").map((c) => c.trim()).filter(Boolean);
	const images = Array.from(imageFiles.values());
	const numPosts = parseInt(numPostsInput.value, 10) || 5;
	if (captions.length === 0) {
		showToast("请至少输入一条文案。");
		return [];
	}
	if (images.length === 0) {
		showToast("请至少上传一张图片。");
		return [];
	}
	const startStr = startDatetime.value;
	const intervalMinutes = parseInt(intervalValue.value, 10) * parseInt(intervalUnit.value, 10);
	let current = new Date(startStr);
	if (isNaN(current.getTime())) {
		current = /* @__PURE__ */ new Date();
		current.setDate(current.getDate() + 1);
		current.setHours(9, 0, 0, 0);
	}
	const posts = [];
	for (let i = 0; i < numPosts; i++) {
		const caption = captions[Math.floor(Math.random() * captions.length)];
		const image = images[Math.floor(Math.random() * images.length)];
		const thumbUrl = URL.createObjectURL(image);
		posts.push({
			text: caption,
			imageName: image.name,
			imageFile: image,
			imageThumbUrl: thumbUrl,
			scheduledAt: new Date(current),
			status: "pending"
		});
		current = new Date(current.getTime() + intervalMinutes * 60 * 1e3);
	}
	return posts;
}
function parseManual() {
	const validRows = manualRows.filter((r) => r.text.trim());
	if (validRows.length === 0) {
		showToast("请至少输入一条帖子正文。");
		return [];
	}
	const startStr = startDatetime.value;
	const intervalMinutes = parseInt(intervalValue.value, 10) * parseInt(intervalUnit.value, 10);
	const shouldRandomize = randomizeTimeCheckbox && randomizeTimeCheckbox.checked;
	let current = new Date(startStr);
	if (isNaN(current.getTime())) {
		current = /* @__PURE__ */ new Date();
		current.setDate(current.getDate() + 1);
		current.setHours(9, 0, 0, 0);
	}
	const posts = [];
	for (const row of validRows) {
		const file = row.imageFile || null;
		const thumbUrl = file ? URL.createObjectURL(file) : null;
		posts.push({
			text: row.text.trim(),
			imageName: file?.name || null,
			imageFile: file,
			imageThumbUrl: thumbUrl,
			scheduledAt: new Date(current),
			status: "pending"
		});
		const baseMs = intervalMinutes * 60 * 1e3;
		if (shouldRandomize) current = new Date(current.getTime() + baseMs * (.7 + Math.random() * .6));
		else current = new Date(current.getTime() + baseMs);
	}
	return posts;
}
function renderPreview() {
	const maxChars = PLATFORM.maxChars || 500;
	postCount.textContent = parsedPosts.length;
	postsList.innerHTML = "";
	parsedPosts.forEach((post, i) => {
		const card = document.createElement("div");
		card.className = "post-card bg-th-card border border-th-border rounded-xl p-5 fade-in";
		card.style.animationDelay = `${i * 50}ms`;
		const charCount = post.text.length;
		const isOverLimit = charCount > maxChars;
		const charColor = isOverLimit ? "text-th-error" : charCount > maxChars - 50 ? "text-th-warning" : "text-th-gray";
		const displayThumb = post.processedThumbUrl || post.imageThumbUrl;
		card.innerHTML = `
      <div class="flex items-start gap-4">
        ${displayThumb ? `<img src="${displayThumb}" class="image-thumb shrink-0" alt="" onclick="openLightbox('${displayThumb}')">` + (post.processedThumbUrl && post.imageThumbUrl ? `<button class="compare-btn text-xs text-th-gray hover:text-white transition-colors cursor-pointer" data-index="${i}" title="对比原图与处理结果">&#x1F50D;</button>` : "") : post.imageName ? `<span class="text-xs text-th-error">${escapeHtml(post.imageName)}（未找到）</span>` : ""}
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-mono text-th-gray bg-th-dark px-2 py-0.5 rounded">#${i + 1}</span>
            <span class="text-xs text-th-gray flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              ${formatDate(post.scheduledAt)}
            </span>
            <span class="${charColor} text-xs">${charCount}/${maxChars}</span>
            ${isOverLimit ? "<span class=\"text-th-error text-xs font-medium\">超过字数限制</span>" : ""}
          </div>
          <p class="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">${escapeHtml(post.text)}</p>
          ${post.processedThumbUrl ? `<span class="text-xs text-th-success mt-1 inline-block">已处理图片</span>` : ""}
        </div>
        <button class="remove-post text-th-gray hover:text-th-error transition-colors shrink-0 p-1" data-index="${i}" title="删除">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    `;
		postsList.appendChild(card);
	});
	document.querySelectorAll(".remove-post").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			const idx = parseInt(e.currentTarget.dataset.index, 10);
			parsedPosts.splice(idx, 1);
			if (parsedPosts.length === 0) handleBack();
			else renderPreview();
		});
	});
	document.querySelectorAll(".compare-btn").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			e.stopPropagation();
			const idx = parseInt(e.currentTarget.dataset.index, 10);
			const post = parsedPosts[idx];
			if (post.imageThumbUrl && post.processedThumbUrl) openComparisonLightbox(post.imageThumbUrl, post.processedThumbUrl);
		});
	});
}
function getStatusHTML(post) {
	if (post.status === "success") return `<span class="status-badge inline-flex items-center gap-1 text-xs font-medium text-th-success bg-th-success/10 px-2.5 py-1 rounded-full"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>已排期</span>`;
	else if (post.status === "error") return `<span class="status-badge inline-flex items-center gap-1 text-xs font-medium text-th-error bg-th-error/10 px-2.5 py-1 rounded-full" title="${escapeHtml(post.error || "未知错误")}"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>失败</span>`;
	else if (post.status === "uploading") return `<span class="status-badge inline-flex items-center gap-1 text-xs font-medium text-th-warning bg-th-warning/10 px-2.5 py-1 rounded-full"><span class="spinner"></span>正在上传图片…</span>`;
	else if (post.status === "scheduling") return `<span class="status-badge inline-flex items-center gap-1 text-xs font-medium text-white bg-white/10 px-2.5 py-1 rounded-full"><span class="spinner"></span>正在排期…</span>`;
	return `<span class="status-badge inline-flex items-center gap-1 text-xs font-medium text-th-gray bg-th-gray/10 px-2.5 py-1 rounded-full">待处理</span>`;
}
function renderResults() {
	const existingCards = resultsList.querySelectorAll(".post-card");
	if (existingCards.length === parsedPosts.length && existingCards.length > 0) {
		parsedPosts.forEach((post, i) => {
			const card = existingCards[i];
			const badge = card.querySelector(".status-badge");
			if (!badge) return;
			if (card.dataset.status === post.status) return;
			card.dataset.status = post.status;
			badge.outerHTML = getStatusHTML(post);
			const errorEl = card.querySelector(".text-th-error.mt-2");
			if (post.error && !errorEl) {
				const textP = card.querySelector(".whitespace-pre-wrap");
				if (textP) textP.insertAdjacentHTML("afterend", `<p class="text-xs text-th-error mt-2">${escapeHtml(post.error)}</p>`);
			}
		});
		return;
	}
	resultsList.innerHTML = "";
	parsedPosts.forEach((post, i) => {
		const card = document.createElement("div");
		card.className = "post-card bg-th-card border border-th-border rounded-xl p-5 fade-in";
		card.dataset.status = post.status;
		card.innerHTML = `
      <div class="flex items-start gap-4">
        ${post.imageThumbUrl ? `<img src="${post.imageThumbUrl}" class="image-thumb shrink-0" alt="" onclick="openLightbox('${post.imageThumbUrl}')">` : ""}
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="text-xs font-mono text-th-gray bg-th-dark px-2 py-0.5 rounded">#${i + 1}</span>
            <span class="text-xs text-th-gray">${formatDate(post.scheduledAt)}</span>
            ${getStatusHTML(post)}
          </div>
          <p class="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">${escapeHtml(post.text)}</p>
          ${post.error ? `<p class="text-xs text-th-error mt-2">${escapeHtml(post.error)}</p>` : ""}
        </div>
      </div>
    `;
		resultsList.appendChild(card);
	});
}
async function handleScheduleAll() {
	if (!await PLATFORM.checkAuth()) {
		showToast(`尚未登录 ${PLATFORM.shortName}，请先打开 ${PLATFORM.domain} 登录。`);
		return;
	}
	const maxChars = PLATFORM.maxChars || 500;
	const overLimit = parsedPosts.filter((p) => p.text.length > maxChars);
	if (overLimit.length > 0) {
		if (!confirm(`有 ${overLimit.length} 条帖子超过 ${maxChars} 字符限制，可能失败。仍要继续吗？`)) return;
	}
	if (startNowCheckbox.checked) {
		const intervalMinutes = parseInt(intervalValue.value, 10) * parseInt(intervalUnit.value, 10);
		let current = /* @__PURE__ */ new Date();
		current.setMinutes(current.getMinutes() + 2);
		parsedPosts.forEach((post) => {
			post.scheduledAt = new Date(current);
			current = new Date(current.getTime() + intervalMinutes * 60 * 1e3);
		});
	} else {
		const now = Date.now();
		const pastPosts = parsedPosts.filter((p) => p.scheduledAt.getTime() <= now);
		if (pastPosts.length > 0) {
			showToast(`有 ${pastPosts.length} 条帖子的排期时间已过去，请修改时间。`, "warning");
			return;
		}
	}
	previewSection.classList.add("hidden");
	progressSection.classList.remove("hidden");
	doneActions.classList.add("hidden");
	let completed = 0;
	let succeeded = 0;
	let failed = 0;
	for (let i = 0; i < parsedPosts.length; i++) {
		const post = parsedPosts[i];
		try {
			let uploadId = null;
			if (post.imageFile) {
				post.status = "uploading";
				renderResults();
				const fileToUpload = post.processedFile || post.imageFile;
				uploadId = await PLATFORM.uploadImage(fileToUpload);
				post.uploadId = uploadId;
			}
			post.status = "scheduling";
			renderResults();
			const draftId = await PLATFORM.createDraft(post.text, uploadId ? [uploadId] : []);
			const publishTime = Math.floor(post.scheduledAt.getTime() / 1e3);
			await PLATFORM.scheduleDraft(draftId, publishTime);
			post.status = "success";
			succeeded++;
		} catch (err) {
			post.status = "error";
			post.error = err.message || "未知错误";
			failed++;
		}
		completed++;
		renderResults();
		updateProgress(completed, parsedPosts.length);
		if (i < parsedPosts.length - 1) await sleep(2e3);
	}
	progressText.textContent = `完成：已排期 ${succeeded} 条，失败 ${failed} 条。`;
	doneActions.classList.remove("hidden");
}
async function refreshBatchDropdown() {
	const batches = await chromeStorageGet("threadscheduler_batches") || [];
	while (batchSelect.options.length > 1) batchSelect.remove(1);
	if (batches.length === 0) {
		batchSelectWrapper.classList.add("hidden");
		return;
	}
	batchSelectWrapper.classList.remove("hidden");
	batches.forEach((batch, i) => {
		const opt = document.createElement("option");
		opt.value = i.toString();
		opt.textContent = batch.name;
		const imgCount = (batch.imageData || []).length;
		const capInfo = batch.mode === "spreadsheet" ? "CSV" : `${(batch.captions || []).length} 条帖子`;
		const modeName = { spreadsheet: "表格导入", manual: "手动输入", random: "随机组合" }[batch.mode] || batch.mode;
		opt.title = `${modeName} · ${capInfo} · ${imgCount} 张图片`;
		batchSelect.appendChild(opt);
	});
	batchSelect.value = "";
	deleteBatchBtn.classList.add("hidden");
}
async function handleBatchSelectChange() {
	const idx = batchSelect.value;
	if (idx === "") {
		handleClear();
		deleteBatchBtn.classList.add("hidden");
		return;
	}
	const batch = (await chromeStorageGet("threadscheduler_batches") || [])[parseInt(idx, 10)];
	if (!batch) return;
	await loadBatch(batch);
	deleteBatchBtn.classList.remove("hidden");
}
async function handleDeleteBatch() {
	const idx = batchSelect.value;
	if (idx === "") return;
	const batches = await chromeStorageGet("threadscheduler_batches") || [];
	const batch = batches[parseInt(idx, 10)];
	if (!batch || !confirm(`删除“${batch.name}”吗？`)) return;
	for (const ref of batch.imageRefs || []) try {
		await idbDelete(ref.idbKey);
	} catch {}
	batches.splice(parseInt(idx, 10), 1);
	await chromeStorageSet("threadscheduler_batches", batches);
	handleClear();
	await refreshBatchDropdown();
}
function dataURLtoFile(dataURL, filename) {
	const [header, base64] = dataURL.split(",");
	const mime = header.match(/:(.*?);/)[1];
	const bytes = atob(base64);
	const arr = new Uint8Array(bytes.length);
	for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
	return new File([arr], filename, { type: mime });
}
async function handleSaveBatch() {
	let captions = [];
	if (currentMode === "spreadsheet") {
		if (!csvData) {
			showToast("没有可保存的内容，请先上传 CSV。");
			return;
		}
		captions = [csvData];
	} else if (currentMode === "manual") {
		const validRows = manualRows.filter((r) => r.text.trim());
		if (validRows.length === 0) {
			showToast("没有可保存的内容，请先输入帖子正文。");
			return;
		}
		captions = validRows.map((r) => r.text);
	} else {
		captions = captionsInput.value.split("\n").filter((c) => c.trim());
		if (captions.length === 0) {
			showToast("没有可保存的内容，请先输入文案。");
			return;
		}
	}
	const name = prompt("为此批次命名：", `批次 ${(/* @__PURE__ */ new Date()).toLocaleDateString("zh-CN")}`);
	if (!name) return;
	const batchId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
	const imageRefs = [];
	const filesToSave = new Map(imageFiles);
	if (currentMode === "manual") {
		for (const row of manualRows) if (row.imageFile && !filesToSave.has(row.imageFile.name)) filesToSave.set(row.imageFile.name, row.imageFile);
	}
	for (const [filename, file] of filesToSave) {
		const buf = await file.arrayBuffer();
		const idbKey = `batch_${batchId}_${filename}`;
		await idbPut(idbKey, {
			name: filename,
			type: file.type,
			buffer: buf
		});
		imageRefs.push({
			name: filename,
			type: file.type,
			idbKey
		});
	}
	const batch = {
		name,
		batchId,
		mode: currentMode,
		captions,
		imageRefs,
		settings: {
			intervalValue: intervalValue.value,
			intervalUnit: intervalUnit.value,
			numPosts: numPostsInput.value,
			imageProcessing: { ...imageProcessingSettings }
		},
		savedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	const batches = await chromeStorageGet("threadscheduler_batches") || [];
	batches.push(batch);
	await chromeStorageSet("threadscheduler_batches", batches);
	await refreshBatchDropdown();
	batchSelect.value = (batches.length - 1).toString();
	deleteBatchBtn.classList.remove("hidden");
}
async function loadBatch(batch) {
	switchMode(batch.mode);
	if (batch.mode === "spreadsheet") {
		csvData = batch.captions[0];
		csvFilename.textContent = "已从保存的批次载入";
		csvFilename.classList.remove("hidden");
	} else if (batch.mode === "manual") {
		manualRows = [];
		if (manualRowsContainer) manualRowsContainer.innerHTML = "";
		for (const caption of batch.captions) addManualRow(caption);
	} else {
		captionsInput.value = batch.captions.join("\n");
		numPostsInput.value = batch.settings.numPosts || "5";
	}
	intervalValue.value = batch.settings.intervalValue || "60";
	intervalUnit.value = batch.settings.intervalUnit || "60";
	const refs = batch.imageRefs || [];
	const legacyImages = batch.imageData || [];
	if (refs.length > 0) {
		imageFiles.clear();
		for (const ref of refs) try {
			const stored = await idbGet(ref.idbKey);
			if (stored) imageFiles.set(ref.name, new File([stored.buffer], stored.name, { type: stored.type }));
		} catch {}
		renderImagePreviews(batch.mode);
	} else if (legacyImages.length > 0) {
		imageFiles.clear();
		for (const img of legacyImages) imageFiles.set(img.name, dataURLtoFile(img.dataURL, img.name));
		renderImagePreviews(batch.mode);
	}
	if (batch.settings.imageProcessing) {
		imageProcessingSettings = { ...batch.settings.imageProcessing };
		syncImageProcessingUI();
	}
}
function syncImageProcessingUI() {
	const rmEl = document.getElementById("remove-metadata");
	const rvEl = document.getElementById("random-variations");
	const hfEl = document.getElementById("horizontal-flip");
	const vcEl = document.getElementById("variation-controls");
	if (rmEl) rmEl.checked = imageProcessingSettings.removeMetadata;
	if (rvEl) rvEl.checked = imageProcessingSettings.randomVariations;
	if (vcEl) vcEl.classList.toggle("hidden", !imageProcessingSettings.randomVariations);
	if (hfEl) hfEl.checked = imageProcessingSettings.horizontalFlip;
	document.querySelectorAll(".crop-ratio-btn").forEach((btn) => {
		btn.classList.toggle("active", imageProcessingSettings.cropRatios.includes(btn.dataset.ratio));
	});
	[
		["sat", "saturationRange"],
		["bright", "brightnessRange"],
		["contrast", "contrastRange"]
	].forEach(([prefix, key]) => {
		const enabledEl = document.getElementById(`${prefix}-enabled`);
		const minEl = document.getElementById(`${prefix}-min`);
		const maxEl = document.getElementById(`${prefix}-max`);
		const labelEl = document.getElementById(`${prefix}-range-label`);
		if (!enabledEl || !minEl || !maxEl || !labelEl) return;
		const [minVal, maxVal] = imageProcessingSettings[key];
		const isEnabled = minVal !== 0 || maxVal !== 0;
		enabledEl.checked = isEnabled;
		minEl.value = minVal;
		maxEl.value = maxVal;
		labelEl.textContent = isEnabled ? `${minVal}% 至 +${maxVal}%` : "已关闭";
	});
}
function chromeStorageGet(key) {
	return new Promise((resolve) => {
		chrome.storage.local.get(key, (result) => resolve(result[key] || null));
	});
}
function chromeStorageSet(key, value) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.set({ [key]: value }, () => {
			if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
			else resolve();
		});
	});
}
function openImageDB() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open("threadscheduler_images", 1);
		req.onupgradeneeded = () => req.result.createObjectStore("blobs");
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
async function idbPut(key, value) {
	const db = await openImageDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction("blobs", "readwrite");
		tx.objectStore("blobs").put(value, key);
		tx.oncomplete = () => {
			db.close();
			resolve();
		};
		tx.onerror = () => {
			db.close();
			reject(tx.error);
		};
	});
}
async function idbGet(key) {
	const db = await openImageDB();
	return new Promise((resolve, reject) => {
		const req = db.transaction("blobs", "readonly").objectStore("blobs").get(key);
		req.onsuccess = () => {
			db.close();
			resolve(req.result);
		};
		req.onerror = () => {
			db.close();
			reject(req.error);
		};
	});
}
async function idbDelete(key) {
	const db = await openImageDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction("blobs", "readwrite");
		tx.objectStore("blobs").delete(key);
		tx.oncomplete = () => {
			db.close();
			resolve();
		};
		tx.onerror = () => {
			db.close();
			reject(tx.error);
		};
	});
}
function handleClear() {
	csvData = null;
	csvHasTimestamps = false;
	imageFiles.clear();
	parsedPosts = [];
	csvFilename.classList.add("hidden");
	imagesCount.classList.add("hidden");
	randomImagesCount.classList.add("hidden");
	imagesPreview.innerHTML = "";
	imagesPreview.classList.add("hidden");
	randomImagesPreview.innerHTML = "";
	randomImagesPreview.classList.add("hidden");
	captionsInput.value = "";
	numPostsInput.value = "5";
	csvFileInput.value = "";
	imageFilesInput.value = "";
	randomImageFilesInput.value = "";
	manualRows = [];
	if (manualRowsContainer) {
		manualRowsContainer.innerHTML = "";
		addManualRow();
	}
	updateScheduleVisibility();
}
function handleBack() {
	parsedPosts.forEach((p) => {
		if (p.processedThumbUrl) URL.revokeObjectURL(p.processedThumbUrl);
		p.processedFile = null;
		p.processedThumbUrl = null;
	});
	previewSection.classList.add("hidden");
	progressSection.classList.add("hidden");
	inputSection.classList.remove("hidden");
}
function handleNewBatch() {
	parsedPosts = [];
	handleClear();
	resultsList.innerHTML = "";
	progressSection.classList.add("hidden");
	previewSection.classList.add("hidden");
	inputSection.classList.remove("hidden");
	doneActions.classList.add("hidden");
	progressBar.style.width = "0%";
}
function updateProgress(current, total) {
	const pct = Math.round(current / total * 100);
	progressBar.style.width = `${pct}%`;
	progressText.textContent = `正在排期第 ${current}/${total} 条帖子…`;
}
function formatDate(date) {
	return date.toLocaleString("zh-CN", {
		weekday: "short",
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: false
	});
}
function escapeHtml(str) {
	const div = document.createElement("div");
	div.textContent = str;
	return div.innerHTML;
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function openComparisonLightbox(originalSrc, processedSrc) {
	const overlay = document.createElement("div");
	overlay.className = "image-lightbox";
	overlay.innerHTML = `
    <div style="display:flex; gap:16px; align-items:center" onclick="event.stopPropagation()">
      <div style="text-align:center">
        <p style="color:#777; font-size:12px; margin-bottom:8px">原图</p>
        <img src="${originalSrc}" style="max-width:42vw; max-height:80vh; border-radius:12px">
      </div>
      <div style="text-align:center">
        <p style="color:#777; font-size:12px; margin-bottom:8px">处理后</p>
        <img src="${processedSrc}" style="max-width:42vw; max-height:80vh; border-radius:12px">
      </div>
    </div>
  `;
	overlay.addEventListener("click", () => {
		URL.revokeObjectURL(processedSrc);
		overlay.remove();
	});
	document.body.appendChild(overlay);
}
function randomInRange(min, max) {
	return min + Math.random() * (max - min);
}
function calculateCropRect(srcWidth, srcHeight, targetRatio) {
	const srcRatio = srcWidth / srcHeight;
	let cropW, cropH;
	if (srcRatio > targetRatio) {
		cropH = srcHeight;
		cropW = Math.round(srcHeight * targetRatio);
	} else {
		cropW = srcWidth;
		cropH = Math.round(srcWidth / targetRatio);
	}
	return {
		x: Math.floor((srcWidth - cropW) / 2),
		y: Math.floor((srcHeight - cropH) / 2),
		w: cropW,
		h: cropH
	};
}
async function processImageForUpload(file, settings) {
	const bitmap = await createImageBitmap(file);
	const srcWidth = bitmap.width;
	const srcHeight = bitmap.height;
	let cropRect = {
		x: 0,
		y: 0,
		w: srcWidth,
		h: srcHeight
	};
	if (settings.randomVariations && settings.cropRatios.length > 0) {
		const numericRatio = CROP_RATIOS[settings.cropRatios[Math.floor(Math.random() * settings.cropRatios.length)]];
		if (numericRatio !== null) cropRect = calculateCropRect(srcWidth, srcHeight, numericRatio);
	}
	const MAX_DIMENSION = 4096;
	let outW = cropRect.w;
	let outH = cropRect.h;
	if (outW > MAX_DIMENSION || outH > MAX_DIMENSION) {
		const scale = MAX_DIMENSION / Math.max(outW, outH);
		outW = Math.round(outW * scale);
		outH = Math.round(outH * scale);
	}
	const canvas = document.createElement("canvas");
	canvas.width = outW;
	canvas.height = outH;
	const ctx = canvas.getContext("2d");
	if (settings.randomVariations) ctx.filter = `saturate(${100 + randomInRange(settings.saturationRange[0], settings.saturationRange[1])}%) brightness(${100 + randomInRange(settings.brightnessRange[0], settings.brightnessRange[1])}%) contrast(${100 + randomInRange(settings.contrastRange[0], settings.contrastRange[1])}%)`;
	if (settings.randomVariations && settings.horizontalFlip && Math.random() < .5) {
		ctx.translate(canvas.width, 0);
		ctx.scale(-1, 1);
	}
	ctx.drawImage(bitmap, cropRect.x, cropRect.y, cropRect.w, cropRect.h, 0, 0, outW, outH);
	bitmap.close();
	if (settings.removeMetadata) {
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const tweaks = 3 + Math.floor(Math.random() * 5);
		for (let i = 0; i < tweaks; i++) {
			const idx = Math.floor(Math.random() * imageData.data.length);
			const delta = Math.random() < .5 ? 1 : -1;
			imageData.data[idx] = Math.max(0, Math.min(255, imageData.data[idx] + delta));
		}
		ctx.putImageData(imageData, 0, 0);
	}
	const MAX_FILE_SIZE = 5 * 1024 * 1024;
	let quality = .92 + Math.random() * .05;
	let blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
	while (blob.size > MAX_FILE_SIZE && quality > .5) {
		quality -= .1;
		blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
	}
	return new File([blob], file.name, { type: "image/jpeg" });
}
//#endregion
//#region ../../../packages/ui/src/shell/index.js
var API_BASE = "https://saasinsiders-backend.vercel.app";
var STAR_SVG = "<svg viewBox=\"0 0 24 24\"><path d=\"M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z\"/></svg>";
function populateStars(container, size) {
	container.innerHTML = "";
	for (let i = 1; i <= 5; i++) {
		const span = document.createElement("span");
		span.innerHTML = STAR_SVG;
		const svg = span.firstElementChild;
		svg.dataset.value = i;
		if (size) {
			svg.style.width = size;
			svg.style.height = size;
		}
		container.appendChild(svg);
	}
}
function highlightStars(container, value, cls) {
	container.querySelectorAll("svg").forEach((svg) => {
		svg.classList.toggle(cls, parseInt(svg.dataset.value) <= value);
	});
}
function clearStars(container, cls) {
	container.querySelectorAll("svg").forEach((svg) => svg.classList.remove(cls));
}
function getBrowserName() {
	const ua = navigator.userAgent;
	if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
	if (ua.includes("Edg")) return "Edge";
	if (ua.includes("Firefox")) return "Firefox";
	if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
	return "Chrome";
}
function initShell(brand) {
	if (brand?.colorScheme === "light") document.documentElement.classList.add("shell-light");
	const footerStars = document.getElementById("shell-footer-stars");
	const supportBtn = document.getElementById("shell-support-btn");
	const feedbackBtn = document.getElementById("shell-feedback-btn");
	const ratingOverlay = document.getElementById("shell-rating-overlay");
	const ratingStars = document.getElementById("shell-modal-stars");
	const rateSubmit = document.getElementById("shell-rate-submit");
	const rateCancel = document.getElementById("shell-rate-cancel");
	const rateName = document.getElementById("shell-rate-name");
	const fbOverlay = document.getElementById("shell-feedback-overlay");
	const fbForm = document.getElementById("shell-fb-form");
	const fbCategory = document.getElementById("shell-fb-category");
	const fbSubject = document.getElementById("shell-fb-subject");
	const fbMessage = document.getElementById("shell-fb-message");
	const fbSubmit = document.getElementById("shell-fb-submit");
	const fbMsg = document.getElementById("shell-fb-msg");
	const fbCancel = document.getElementById("shell-fb-cancel");
	const fbEmail = document.getElementById("shell-fb-email");
	const thanksOverlay = document.getElementById("shell-thanks-overlay");
	const thanksName = document.getElementById("shell-thanks-name");
	const thanksTip = document.getElementById("shell-thanks-tip");
	const thanksReview = document.getElementById("shell-thanks-review");
	const thanksCancel = document.getElementById("shell-thanks-cancel");
	const versionEl = document.getElementById("shell-footer-version");
	populateStars(footerStars);
	populateStars(ratingStars);
	const extName = brand?.name || "此扩展";
	if (rateName) rateName.textContent = extName;
	if (thanksName) thanksName.textContent = extName;
	if (supportBtn) supportBtn.textContent = "赞助";
	const manifest = chrome.runtime.getManifest();
	if (versionEl) versionEl.textContent = `${extName} v${manifest.version} · ${getBrowserName()}`;
	if (brand?.brandColor) document.documentElement.style.setProperty("--shell-brand", brand.brandColor);
	const userEmail = "";
	if (fbEmail) fbEmail.textContent = "";
	let selectedRating = 0;
	footerStars.addEventListener("mouseover", (e) => {
		const svg = e.target.closest("svg");
		if (!svg) return;
		highlightStars(footerStars, parseInt(svg.dataset.value), "star-hover");
	});
	footerStars.addEventListener("mouseleave", () => clearStars(footerStars, "star-hover"));
	footerStars.addEventListener("click", (e) => {
		const svg = e.target.closest("svg");
		if (!svg) return;
		openRatingModal(parseInt(svg.dataset.value));
	});
	ratingStars.addEventListener("mouseover", (e) => {
		const svg = e.target.closest("svg");
		if (!svg) return;
		highlightStars(ratingStars, parseInt(svg.dataset.value), "star-hover");
	});
	ratingStars.addEventListener("mouseleave", () => {
		clearStars(ratingStars, "star-hover");
	});
	ratingStars.addEventListener("click", (e) => {
		const svg = e.target.closest("svg");
		if (!svg) return;
		selectedRating = parseInt(svg.dataset.value);
		clearStars(ratingStars, "star-active");
		highlightStars(ratingStars, selectedRating, "star-active");
		rateSubmit.disabled = false;
	});
	function openRatingModal(preselect) {
		selectedRating = preselect || 0;
		clearStars(ratingStars, "star-active");
		if (preselect) {
			highlightStars(ratingStars, preselect, "star-active");
			rateSubmit.disabled = false;
		} else rateSubmit.disabled = true;
		ratingOverlay.classList.add("open");
	}
	window.__shellOpenRating = openRatingModal;
	function closeRating() {
		ratingOverlay.classList.remove("open");
	}
	function closeFeedback() {
		fbOverlay.classList.remove("open");
		fbForm.reset();
		fbMsg.textContent = "";
		fbMsg.className = "shell-msg";
		fbSubmit.disabled = false;
		fbSubmit.textContent = "发送";
	}
	function closeThanks() {
		thanksOverlay.classList.remove("open");
	}
	function handleRating() {
		closeRating();
		if (selectedRating >= 4) thanksOverlay.classList.add("open");
		else openFeedback();
	}
	function openFeedback() {
		fbOverlay.classList.add("open");
		if (fbCategory) fbCategory.value = "";
		fbSubject.focus();
	}
	rateSubmit.addEventListener("click", handleRating);
	feedbackBtn.addEventListener("click", openFeedback);
	rateCancel.addEventListener("click", closeRating);
	fbCancel.addEventListener("click", closeFeedback);
	thanksTip.addEventListener("click", () => {
		const source = brand?.source || "unknown";
		window.open(`https://ericotten.org/support/${source}`, "_blank");
		closeThanks();
	});
	thanksReview.addEventListener("click", () => {
		const cwsId = brand?.stores?.chrome?.id;
		if (cwsId) window.open(`https://chromewebstore.google.com/detail/${cwsId}/reviews`, "_blank");
		closeThanks();
	});
	thanksCancel.addEventListener("click", closeThanks);
	ratingOverlay.addEventListener("click", (e) => {
		if (e.target === ratingOverlay) closeRating();
	});
	fbOverlay.addEventListener("click", (e) => {
		if (e.target === fbOverlay) closeFeedback();
	});
	thanksOverlay.addEventListener("click", (e) => {
		if (e.target === thanksOverlay) closeThanks();
	});
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			closeRating();
			closeFeedback();
			closeThanks();
		}
	});
	fbForm.addEventListener("submit", async (e) => {
		e.preventDefault();
		const category = fbCategory?.value || "";
		const subject = fbSubject.value.trim();
		const message = fbMessage.value.trim();
		if (!subject || !message) return;
		fbSubmit.disabled = true;
		fbSubmit.textContent = "正在发送…";
		fbMsg.textContent = "";
		try {
			const data = await (await fetch(`${API_BASE}/api/support`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: userEmail,
					source: brand?.source || "unknown",
					version: `${manifest.version} ${getBrowserName()}`,
					category,
					subject,
					message
				})
			})).json();
			if (data.success !== false) {
				fbMsg.textContent = "发送成功，谢谢！";
				fbMsg.className = "shell-msg shell-msg-ok";
				setTimeout(closeFeedback, 1500);
			} else {
				fbMsg.textContent = data.message || "操作失败，请重试。";
				fbMsg.className = "shell-msg shell-msg-err";
				fbSubmit.disabled = false;
				fbSubmit.textContent = "发送";
			}
		} catch {
			fbMsg.textContent = "网络错误，请重试。";
			fbMsg.className = "shell-msg shell-msg-err";
			fbSubmit.disabled = false;
			fbSubmit.textContent = "发送";
		}
	});
	supportBtn.addEventListener("click", () => {
		const source = brand?.source || "unknown";
		window.open(`https://ericotten.org/support/${source}`, "_blank");
	});
}
//#endregion
//#region src/pages/scheduler.js
initShell(BRAND);
//#endregion
