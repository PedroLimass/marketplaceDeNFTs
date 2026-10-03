/** `0x7A42...19E8`: início e fim do endereço, no formato do design. */
export function shortenAddress(address: string, head = 6, tail = 4): string {
  if (address.length <= head + tail + 3) return address
  return `${address.slice(0, head)}...${address.slice(-tail)}`
}
