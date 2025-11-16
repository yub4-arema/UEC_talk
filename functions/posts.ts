import {doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy, limit} from "firebase/firestore";
import { db } from "./firebase";
import { Post , Latest50PostsResponse} from "./types";

export async function makePost(post : Post){
    post.createdAt = new Date();
    const postsCollection = collection(db, "posts");
    const docRef = await addDoc(postsCollection, post);
    
    await updateLatest50PostsCache();
    
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

export async function updateLatest50PostsCache(): Promise<void> {
    const postsCollection = collection(db, "posts");
    const q = query(postsCollection, orderBy("createdAt", "desc"), limit(50));
    const querySnapshot = await getDocs(q);
    
    const posts = querySnapshot.docs.map(doc => doc.data() as Post);
    
    const cacheData: Latest50PostsResponse = { posts };
    const cacheRef = doc(db, "cache", "latest50Posts");
    await setDoc(cacheRef, cacheData);
}

export async function getLatest50Posts(): Promise<Latest50PostsResponse> {
    const cacheRef = doc(db, "cache", "latest50Posts");
    const cacheSnap = await getDoc(cacheRef);
    if (cacheSnap.exists()) {
        return cacheSnap.data() as Latest50PostsResponse;
    } else {
        return { posts: [] };
    }
}