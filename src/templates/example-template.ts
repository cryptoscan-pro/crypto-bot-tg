export default function(data: Record<string, any>): string {
    return `Custom formatted message:
Price: ${data.price}
Volume: ${data.volume}
Change: ${data.change}%`;
}
