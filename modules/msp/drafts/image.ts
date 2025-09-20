// import type { User } from '@aimpact/agents-client/users';
// import { ErrorGenerator } from '@aimpact/ailearn-api/business/errors';
// import { BusinessResponse } from '@aimpact/ailearn-api/business/response';
// import { drafts, ailearnUsers as users, homes } from '@aimpact/ailearn-api/data/model';
// import { storage } from '@aimpact/ailearn-api/storage';
// import * as dotenv from 'dotenv';
// import * as sharp from 'sharp';
// import { DraftsBase } from './base';

// dotenv.config();
// const { IMAGES_SIZES_LG, IMAGES_SIZES_MD, IMAGES_SIZES_SM, IMAGES_SIZES_XS } = process.env;
// const sizes = {
// 	lg: parseInt(IMAGES_SIZES_LG),
// 	md: parseInt(IMAGES_SIZES_MD),
// 	sm: parseInt(IMAGES_SIZES_SM),
// 	xs: parseInt(IMAGES_SIZES_XS)
// };
// const SIZES = [
// 	{ size: 'lg', width: sizes.lg, height: sizes.lg, quality: 70 },
// 	{ size: 'md', width: sizes.md, height: sizes.md, quality: 70 },
// 	{ size: 'sm', width: sizes.sm, height: sizes.sm, quality: 70 },
// 	{ size: 'xs', width: sizes.xs, height: sizes.xs, quality: 70 }
// ];

// export const download = async (url: string, type: string, id: string) => {
// 	const response = await fetch(url);
// 	if (!response.ok) return { error: ErrorGenerator.failedToGenerateImage(url, response.statusText) };

// 	const { MODULES_IMAGES_BUCKET, GCLOUD_URL } = process.env;
// 	const bucket = storage.bucket(MODULES_IMAGES_BUCKET);

// 	const arrayBuffer = await response.arrayBuffer();
// 	const buffer = Buffer.from(arrayBuffer);

// 	const metadata = await sharp(buffer).metadata();
// 	const originalWidth = metadata.width;
// 	const originalHeight = metadata.height;

// 	const path = `${id}.jpg`;
// 	await bucket.file(path).save(Buffer.from(buffer), {
// 		metadata: { contentType: 'image/jpeg' }
// 	});

// 	const promises = [];
// 	for (const { size, width, height, quality } of SIZES) {
// 		const aspectRatio = originalWidth / originalHeight;

// 		let newWidth, newHeight;
// 		if (width / height > aspectRatio) {
// 			newHeight = height;
// 			newWidth = Math.round(height * aspectRatio);
// 		} else {
// 			newWidth = width;
// 			newHeight = Math.round(width / aspectRatio);
// 		}

// 		const resizedImage = await sharp(Buffer.from(buffer))
// 			.resize({
// 				width: newWidth,
// 				height: newHeight,
// 				fit: sharp.fit.cover
// 			})
// 			.toBuffer();
// 		const compressedImage = await sharp(resizedImage).jpeg({ quality }).toBuffer();
// 		const path = `${id}-${size}.jpg`;
// 		promises.push(bucket.file(path).save(compressedImage, { metadata: { contentType: 'image/jpeg' } }));
// 	}
// 	await Promise.all(promises);

// 	return { picture: `${GCLOUD_URL}/${type}/${id}/picture` };
// };

// export const image = async (id: string, url: string, user: User) => {
// 	try {
// 		const response = await DraftsBase.get(id, user);
// 		if (response.error) return new BusinessResponse({ error: response.error });
// 		const draft = response.data;

// 		if (user.uid !== draft.creator.id) {
// 			return new BusinessResponse({ error: ErrorGenerator.userNotAuthorized() });
// 		}

// 		const { picture, error } = await download(url, 'modules', draft.id);
// 		if (error) return new BusinessResponse({ error });

// 		// Process credit discount
// 		const credits = draft.credits;
// 		credits.consumed = ++credits.consumed;

// 		const ai = true; // This property is only defined with AI

// 		const responseDraft = await drafts.merge({ id: draft.id, data: { picture, credits, ai } });
// 		if (responseDraft.error) return new BusinessResponse({ error: responseDraft.error });

// 		const parents = { Users: user.uid };
// 		const usersDrafts = await users.drafts.merge({ id: draft.id, data: { picture, ai }, parents });
// 		if (usersDrafts.error) return new BusinessResponse({ error: usersDrafts.error });

// 		const homeResponse = await homes.data({ id: user.uid });
// 		if (homeResponse.error) return { error: homeResponse.error };
// 		const homeDrafts = homeResponse.data.exists ? homeResponse.data.data?.drafts ?? [] : [];

// 		let found = false;
// 		homeDrafts.forEach(draft => {
// 			if (draft.id !== id) return;
// 			found = true;
// 			draft.picture = picture;
// 		});
// 		if (found) {
// 			const responseHomes = await homes.merge({ id: user.uid, data: { drafts: homeDrafts } });
// 			if (responseHomes.error) return { error: responseHomes.error };
// 		}

// 		return new BusinessResponse({ data: { stored: true, picture, credits } });
// 	} catch (exc) {
// 		return new BusinessResponse({ error: ErrorGenerator.internalErrorTrace({ code: `B0008`, exc }) });
// 	}
// };
