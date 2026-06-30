"use client"

import { useRouter } from "next/navigation"
import MongoDocs from "@/components/docs/MongoDocs"

export default function DocsPage() {
    const router = useRouter()
    return (
        <div className="fixed inset-0 bg-white">
            <MongoDocs onClose={() => router.back()} />
        </div>
    )
}
