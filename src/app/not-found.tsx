import Link from "next/link";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <Shell>
      <Card className="mx-auto max-w-xl space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-surge">404</p>
        <h1 className="text-3xl font-black text-ink">这个学习台阶还没有建好</h1>
        <p className="text-slate-500">返回首页继续单词、句子和短文训练。</p>
        <Link href="/">
          <Button>回到首页</Button>
        </Link>
      </Card>
    </Shell>
  );
}
