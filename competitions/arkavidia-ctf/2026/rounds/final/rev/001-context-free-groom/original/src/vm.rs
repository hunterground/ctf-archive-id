use std::io;

fn rotl(x: u32, r: u32) -> u32 {
    (x << r) | (x >> (32 - r))
}

fn rotr(x: u32, r: u32) -> u32 {
    (x >> r) | (x << (32 - r))
}

struct VM {
    ip: usize,
    state: u32,
    stack: Vec<u8>,
    input: Vec<u8>,
    idx: usize,

    reg: u8,
    base: u8,
    v: u8,
    flag: bool,
}

impl VM {
    fn new(input: Vec<u8>) -> Self {
        Self {
            ip: 0,
            state: 0xA2DDC87C,
            stack: Vec::new(),
            input,
            idx: 0,
            reg: 0,
            base: 0,
            v: 0,
            flag: false,
        }
    }

    fn run(&mut self, bytecode: &[u8]) -> bool {
        while self.ip < bytecode.len() {
            let op = bytecode[self.ip];
            self.ip += 1;

            match op {

                0x01 => {
                    if self.idx >= self.input.len() { return false; }
                    self.reg = self.input[self.idx];
                    self.idx += 1;
                }

                0x02 => {
                    self.base = match self.reg {
                        b'a'..=b'z' => ((self.reg - b'a') % 3) + 1,
                        b'A'..=b'Z' => ((self.reg - b'A') % 3) + 1,
                        b'0'..=b'9' => ((self.reg - b'0') % 3) + 1,
                        b'_' => 2,
                        _ => return false,
                    };
                }

                0x03 => {
                    let tmp = self.base ^ (self.state as u8 & 3);
                    self.v = (tmp % 3) + 1;
                }

                0x04 => {
                    self.flag = (self.state & 1) == 0;
                }

                0x05 => {
                    let addr = u16::from_le_bytes([
                        bytecode[self.ip],
                        bytecode[self.ip+1]
                    ]) as usize;
                    self.ip += 2;
                    if !self.flag {
                        self.ip = addr;
                    }
                }
                0x06 => {
                    let addr = u16::from_le_bytes([
                        bytecode[self.ip],
                        bytecode[self.ip+1]
                    ]) as usize;
                    self.ip = addr;
                }
                0x07 => {
                    self.stack.push(self.v);
                }
                0x08 => {
                    if self.stack.pop() != Some(self.v) {
                        return false;
                    }
                }
                0x09 => {
                    self.state = rotl(self.state,3)
                        ^ ((self.v as u32) * 0x9E3779B1);
                    self.state =
                        self.state.wrapping_add(self.state >> 5);
                }
                0x0A => {
                    self.state = rotr(self.state,2)
                        ^ ((self.v as u32) * 0x85EBCA77);
                    self.state ^= self.state << 7;
                }
                0x0C => {
                    let target = bytecode[self.ip];
                    self.ip += 1;
                    if self.reg ^ (self.state as u8) != target {
                        return false;
                    }
                }
                0x0B => {
                    return self.stack.is_empty()
                        && self.state == 0xA44D0530;
                }
                _ => return false,
            }
        }
        false
    }
}

fn main() {
    println!("Enter flag:");
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();

    let input = input.trim().as_bytes().to_vec();

    if !input.starts_with(b"ARKAV{") || !input.ends_with(b"}") {
        println!("Wrong format");
        return;
    }

    let mut inner = input[6..input.len()-1].to_vec();

    if inner.len() < 24 {
        println!("Too short!");
        return;
    }

    inner.truncate(24);

    let bytecode = std::fs::read("CFG").unwrap();

    let mut vm = VM::new(inner);
    if vm.run(&bytecode) {
        println!("Correct!");
    } else {
        println!("Wrong!");
    }
}
