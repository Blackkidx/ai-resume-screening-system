"""
Script to deduplicate resumes in MongoDB.
Keeps only the most recent processed resume for each user.
Deletes the old records and attempts to delete the associated physical files.
"""
from pymongo import MongoClient
import os

MONGO_URL = "mongodb+srv://rakeiei244:rakeiei2444@resume-screening.knyxpww.mongodb.net/ai_resume_screening?retryWrites=true&w=majority&ssl=true&tlsAllowInvalidCertificates=true"

def main():
    print("Connecting to MongoDB...")
    try:
        client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=15000)
        db = client["ai_resume_screening"]
        db.command("ping")
        print("Connected!\n")
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    # 1. Get all users who have resumes
    resumes = list(db.resumes.find({}, sort=[("uploaded_at", -1)]))
    print(f"Total resumes found: {len(resumes)}")
    
    if not resumes:
        return
        
    # Group by user_id
    user_resumes = {}
    for r in resumes:
        uid = str(r.get("user_id", "unknown"))
        if uid not in user_resumes:
            user_resumes[uid] = []
        user_resumes[uid].append(r)
        
    print(f"Found resumes for {len(user_resumes)} distinct users.")
    
    # 2. Identify ones to keep vs delete
    to_delete_ids = []
    files_to_delete = []
    kept_count = 0
    
    for uid, user_rs in user_resumes.items():
        if len(user_rs) <= 1:
            kept_count += 1
            continue
            
        print(f"\nUser {uid} has {len(user_rs)} resumes:")
        
        # Sort by uploaded_at descending (latest first)
        # We already sorted when querying, but let's be explicit
        
        # Find the best one to keep (prefer 'processed' status)
        keep_resume = None
        for r in user_rs:
            if r.get("status") == "processed":
                keep_resume = r
                break
                
        # If no processed ones, just keep the latest
        if not keep_resume:
            keep_resume = user_rs[0]
            
        print(f"  -> Keeping: {keep_resume['_id']} ({keep_resume.get('status')} - {keep_resume.get('file_name', '')})")
        kept_count += 1
        
        # Mark others for deletion
        for r in user_rs:
            if str(r["_id"]) != str(keep_resume["_id"]):
                to_delete_ids.append(r["_id"])
                if "file_path" in r and r["file_path"]:
                    files_to_delete.append(r["file_path"])
                print(f"  -> Deleting: {r['_id']} (uploaded: {r.get('uploaded_at')})")
                
    # 3. Execute deletions
    if to_delete_ids:
        print(f"\nProceeding to delete {len(to_delete_ids)} duplicate records...")
        
        # Delete from DB
        result = db.resumes.delete_many({"_id": {"$in": to_delete_ids}})
        print(f"Deleted {result.deleted_count} documents from MongoDB.")
        
        # Try to delete physical files
        files_deleted = 0
        files_failed = 0
        for fp in files_to_delete:
            try:
                # Assuming script runs from backend dir
                if os.path.exists(fp):
                    os.remove(fp)
                    files_deleted += 1
                else:
                    # Try with relative path adjustment just in case
                    base_name = os.path.basename(fp)
                    alt_path = os.path.join("uploads", "resumes", base_name)
                    if os.path.exists(alt_path):
                        os.remove(alt_path)
                        files_deleted += 1
                    else:
                        files_failed += 1
            except Exception as e:
                print(f"  Warning: couldn't delete file {fp}: {e}")
                files_failed += 1
                
        print(f"Deleted {files_deleted} physical files ({files_failed} not found/failed).")
    else:
        print("\nNo duplicates found! Everything is clean.")
        
    print(f"\nFinal State: {kept_count} unique resumes left in DB.")
    client.close()

if __name__ == "__main__":
    main()
