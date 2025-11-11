import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  where,
  limit,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import type { Post } from './types';

/**
 * ガチャ結果を投稿する
 * @param nickname - 投稿者のニックネーム
 * @param drink1_id - 1本目のドリンクID
 * @param drink2_id - 2本目のドリンクID
 * @param profits - お得額
 * @param pictureFile - 投稿画像（オプション）
 * @returns 作成された投稿のID
 */
export async function createPost(
  nickname: string,
  drink1_id: number,
  drink2_id: number,
  profits: number,
  pictureFile?: File
): Promise<string> {
  try {
    let pictureUrl = '';

    // 画像がある場合はStorageにアップロード
    if (pictureFile) {
      const timestamp = Date.now();
      const storageRef = ref(storage, `posts/${timestamp}_${pictureFile.name}`);
      await uploadBytes(storageRef, pictureFile);
      pictureUrl = await getDownloadURL(storageRef);
    }

    // Firestoreに投稿を保存
    const postsRef = collection(db, 'posts');
    const docRef = await addDoc(postsRef, {
      nickname,
      postedAt: Timestamp.now(),
      drink1_id,
      drink2_id,
      pictureUrl,
      profits,
    });

    return docRef.id;
  } catch (error) {
    console.error('投稿の作成に失敗しました:', error);
    throw new Error('投稿の作成に失敗しました');
  }
}

/**
 * Firestore DocumentDataをPost型に変換する
 * @param id - ドキュメントID
 * @param data - Firestoreのドキュメントデータ
 * @returns Post型のオブジェクト
 */
function convertToPost(id: string, data: DocumentData): Post {
  return {
    id: parseInt(id, 36), // Firestore IDを数値に変換（簡易的な実装）
    nickname: data.nickname,
    postedAt: data.postedAt.toDate(),
    drink1_id: data.drink1_id,
    drink2_id: data.drink2_id,
    pictureUrl: data.pictureUrl || '',
    profits: data.profits,
  };
}

/**
 * タイムライン表示用の投稿一覧を取得（新順）
 * @param limitCount - 取得件数（デフォルト: 50）
 * @returns 投稿の配列
 */
export async function getPosts(limitCount: number = 50): Promise<Post[]> {
  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('postedAt', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);

    const posts: Post[] = [];
    querySnapshot.forEach((doc) => {
      posts.push(convertToPost(doc.id, doc.data()));
    });

    return posts;
  } catch (error) {
    console.error('投稿一覧の取得に失敗しました:', error);
    throw new Error('投稿一覧の取得に失敗しました');
  }
}

/**
 * 特定の投稿を取得
 * @param postId - 投稿ID
 * @returns Post型のオブジェクト、見つからない場合はnull
 */
export async function getPostById(postId: string): Promise<Post | null> {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return null;
    }

    return convertToPost(postSnap.id, postSnap.data());
  } catch (error) {
    console.error('投稿の取得に失敗しました:', error);
    throw new Error('投稿の取得に失敗しました');
  }
}

/**
 * 自分の投稿した投稿一覧を取得
 * @param postIds - 投稿IDの配列（ローカルストレージから取得）
 * @returns 投稿の配列
 */
export async function getMyPosts(postIds: string[]): Promise<Post[]> {
  try {
    if (postIds.length === 0) {
      return [];
    }

    const posts: Post[] = [];

    // 各投稿IDに対して個別に取得
    // Firestoreの制限により、in クエリは最大10件までのため、個別取得を推奨
    for (const postId of postIds) {
      const post = await getPostById(postId);
      if (post) {
        posts.push(post);
      }
    }

    // 投稿日時の新しい順にソート
    posts.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());

    return posts;
  } catch (error) {
    console.error('自分の投稿一覧の取得に失敗しました:', error);
    throw new Error('自分の投稿一覧の取得に失敗しました');
  }
}
