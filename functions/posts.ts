import {doc, getDoc, collection, addDoc, getDocs, query, orderBy, limit} from "firebase/firestore";
import { db } from "./firebase";
import { Post , Latest50PostsResponse} from "./types";

export async function makePost(post : Post){
    post.createdAt = new Date();
    const postsCollection = collection(db, "posts");
    const docRef = await addDoc(postsCollection, post);
    return docRef.id;
}

export async function getPostById(id: string): Promise<Post | null> {
    const postRef = doc(db, "posts", id);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
        return postSnap.data() as Post;
    } else {
        return null;
    }
}


const parseEnvironmentLimit = (value: string | undefined, fallback: number) => {
    if (!value) return fallback;
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
        return Math.floor(parsed);
    }
    return fallback;
};

const POSTS_FETCH_LIMIT = parseEnvironmentLimit(process.env.POSTS_LATEST_LIMIT, 50);

export async function getLatestPosts(maxItems: number = POSTS_FETCH_LIMIT): Promise<Latest50PostsResponse> {
    const postsCollection = collection(db, "posts");
    const q = query(postsCollection, orderBy("createdAt", "desc"), limit(maxItems));
    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];
    querySnapshot.forEach((doc) => {
        posts.push(doc.data() as Post);
    });
    return { posts };
}

export async function getLatest50Posts(): Promise<Latest50PostsResponse> {
    return getLatestPosts(50);
}