
## My Little Computer
### Diffculty: easy

#### https://github.com/haplesshero13/lc3tools

Since LC3 is a RISC machine, the output is expected to be possibly huge. Use the provided LC3 simulator to do our analysis, there are a lot of other tools out there.


From this [documentation](https://www.jmeiners.com/lc3-vm/supplies/lc3-isa.pdf) we know that, an lc3 machine contains some predefined trap handler such as GETC, PUTS, HALT, etc, which can be used to interact with user input. We notice that this executable does not have the implementation of such trap handler, which means that we must use a simulator somewhere which impelements it.


Using this simulator which also included an OS, we can start to run it

```
PC=x0494 IR=xB1AE PSR=x0400 (ZERO)
R0=x0000 R1=x7FFF R2=xFFF6 R3=x0000 R4=x3243 R5=xEFFF R6=xEFFE R7=x0490 
                   x0494 x0FF9 BRNZP TRAP_HALT
(lc3sim) file chall.lc3
Loaded "chall.lc3" and set PC to x3000
(lc3sim) c
Enter flag: ARKAV{}
Failed
```


It looks like a simple flag checker, which prints out 'Failed' if it doesn't match the actual flag, and possibly 'Success' if it matches. We can see from the disassembler result that the string at the end matches the string from input prompt,


```
	.FILL x53    ;  'S'
	.FILL x75    ;  'u'
	.FILL x63    ;  'c'
	.FILL x63    ;  'c'
	.FILL x65    ;  'e'
	.FILL x73    ;  's'
	.FILL x73    ;  's'
	.FILL x0
	.FILL x40    ;  '@'
	.FILL x46    ;  'F'
lbl96
	.FILL x61    ;  'a'
	.FILL x69    ;  'i'
	.FILL x6C    ;  'l'
	.FILL x65    ;  'e'
	.FILL x64    ;  'd'
	.FILL x20    ;  ' '
	.FILL x25    ;  '%'
	.FILL x64    ;  'd'
	.FILL x20    ;  ' '
	.FILL x25    ;  '%'
	.FILL x64    ;  'd'
	.FILL x0
	BRz lbl113
	.FILL x11
	.FILL x0
	.FILL x25    ;  '%'
	.FILL x73    ;  's'
	.FILL x0
	.FILL x1
	.FILL x45    ;  'E'
	.FILL x6E    ;  'n'
	.FILL x74    ;  't'
	.FILL x65    ;  'e'
	.FILL x72    ;  'r'
	.FILL x20    ;  ' '
	.FILL x66    ;  'f'
	.FILL x6C    ;  'l'
	.FILL x61    ;  'a'
	.FILL x67    ;  'g'
	.FILL x3A    ;  ':'
	.FILL x20    ;  ' '
	.FILL x0
	.FILL x41    ;  'A'
	.FILL x52    ;  'R'
	.FILL x4B    ;  'K'
	.FILL x41    ;  'A'
	.FILL x56    ;  'V'
	.FILL x7B    ;  '{'
	.FILL x69    ;  'i'
lbl84
	.FILL x73    ;  's'
	.FILL x5F    ;  '_'
	.FILL x69    ;  'i'
	.FILL x74    ;  't'
lbl71
	.FILL x5F    ;  '_'
	.FILL x72    ;  'r'
	.FILL x65    ;  'e'
lbl74
	.FILL x61    ;  'a'
	.FILL x6C    ;  'l'
	.FILL x6C    ;  'l'
lbl56
	.FILL x79    ;  'y'
	.FILL x5F    ;  '_'
	.FILL x74    ;  't'
	.FILL x68    ;  'h'
	.FILL x69    ;  'i'
lbl82
	.FILL x73    ;  's'
	.FILL x5F    ;  '_'
lbl80
	.FILL x65    ;  'e'
	.FILL x61    ;  'a'
	.FILL x73    ;  's'
	.FILL x79    ;  'y'
	.FILL x3F    ;  '?'
	.FILL x5D    ;  ']'
	.FILL x0
    .END
```

Also notice the fake flag at the end, the '%s', and the '%d' string which could possibly hint that the program uses scanf() and printf() like function. The name of the other file is 'stdlib.obj', we can assume that our input/output function is implemented there.


Let's do a dynamic analysis on it.


Immediately after starting it in the simulator, we can see what looks like an _entry function which jumpts to the actual main subroutine

```
x3008 x2803 LD    R4,GLOBAL_DATA_POINTER
x3009 x2E03 LD    R7,GLOBAL_MAIN_POINTER
x300A x41C0 JSRR  R7
x300B xF025 HALT
```

After executing instruction 0x3009, we see that GLOBAL_MAIN_POINTER = 0x300E
```
PC=x300A IR=x2E03 PSR=x0200 (POSITIVE)
R0=x0000 R1=xFF8D R2=x0073 R3=x0040 R4=x324A R5=xEFFF R6=xEFFF R7=x300E 
```


This is the main function,
```
main    x300E x1DBE ADD   R6,R6,#-2
        x300F x7F80 STR   R7,R6,#0
        x3010 x1DBF ADD   R6,R6,#-1
        x3011 x7B80 STR   R5,R6,#0
        x3012 x1BBF ADD   R5,R6,#-1
        x3013 x1DB0 ADD   R6,R6,#-16
        x3014 x1DB0 ADD   R6,R6,#-16
        x3015 x1DB0 ADD   R6,R6,#-16
        x3016 x1DB0 ADD   R6,R6,#-16
        x3017 x1DB0 ADD   R6,R6,#-16
        x3018 x1DB0 ADD   R6,R6,#-16
```

After looking around we found this,


```
PC=x3029 IR=x6000 PSR=x0200 (POSITIVE)
R0=x31D7 R1=xFF8D R2=x0073 R3=x0040 R4=x324A R5=xEFFB R6=xEF95 R7=x32AE 
                   x3029 x4000 JSRR  R0
(lc3sim) 
Enter flag:
```

Before the prompt we are at PC = 0x3029, 

```
PC=x3029 IR=x6000 PSR=x0200 (POSITIVE)
R0=x31D7 R1=x7FFF R2=xFFF6 R3=x0000 R4=x324A R5=xEFFB R6=xEF95 R7=x32AE 
B                  x3029 x4000 JSRR  R0
(lc3sim) l
        x3024 x102F ADD   R0,R0,#15
        x3025 x102F ADD   R0,R0,#15
        x3026 x102F ADD   R0,R0,#15
        x3027 x102A ADD   R0,R0,#10
        x3028 x6000 LDR   R0,R0,#0
B       x3029 x4000 JSRR  R0
```


Inspecting it we found that we are about to jump to a subroutine at address 0x31D7 which is obviously gonna be some kind of printf("Enter flag:").


We also noticed that the jump which causes the program to print 'Failed' is located at 0x30C3.


```
PC=x30C3 IR=x6000 PSR=x0200 (POSITIVE)
R0=x31D7 R1=xFF8D R2=x324A R3=x324A R4=x324A R5=xEFFB R6=xEF90 R7=x329A 
                   x30C3 x4000 JSRR  R0
(lc3sim) 
Failed
```

And the jump to scanf()-like subroutine is done at 0x3044


```
PC=x3044 IR=x6000 PSR=x0200 (POSITIVE)
R0=x311F R1=xFFDB R2=xFFFB R3=x0000 R4=x324A R5=xEFFB R6=xEF93 R7=x32AA 
                   x3044 x4000 JSRR  R0
(lc3sim) 
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
```


Which means that between x3045 and x30C3 is the main part of the flag checker, lets inspect it dynamically again by inputting a well known input of long 'AAAA', it should appear as hex value 0x0041 somewhere. Keep in mind that the first character of the flag is guaranteed to be 'A' since it has the format 'ARKAV{*.}'

```
PC=x3068 IR=x15C2 PSR=x0800 (NEGATIVE)
R0=x30E0 R1=xFF8D R2=xEF96 R3=x0011 R4=x324A R5=xEFFB R6=xEF93 R7=x0000 
                   x3068 x6480 LDR   R2,R2,#0
(lc3sim) 
PC=x3069 IR=x6480 PSR=x0200 (POSITIVE)
R0=x30E0 R1=xFF8D R2=x0041 R3=x0011 R4=x324A R5=xEFFB R6=xEF93 R7=x0000 
                   x3069 x1DBF ADD   R6,R6,#-1
```

It looks like the buffer for our input is located at 0xEF96. Now lets look at this interesting sequence,

```
PC=x3073 IR=x0202 PSR=x0200 (POSITIVE)
R0=x0000 R1=xFF8D R2=x0041 R3=x0011 R4=x324A R5=xEFFB R6=xEF91 R7=x0000 
               L17 x3073 x1003 ADD   R0,R0,R3
(lc3sim) 
PC=x3074 IR=x1003 PSR=x0200 (POSITIVE)
R0=x0011 R1=xFF8D R2=x0041 R3=x0011 R4=x324A R5=xEFFB R6=xEF91 R7=x0000 
                   x3074 x14BF ADD   R2,R2,#-1
(lc3sim) 
PC=x3075 IR=x14BF PSR=x0200 (POSITIVE)
R0=x0011 R1=xFF8D R2=x0040 R3=x0011 R4=x324A R5=xEFFB R6=xEF91 R7=x0000 
                   x3075 x0BFD BRNP  L17
(lc3sim) 
PC=x3073 IR=x0BFD PSR=x0200 (POSITIVE)
R0=x0011 R1=xFF8D R2=x0040 R3=x0011 R4=x324A R5=xEFFB R6=xEF91 R7=x0000 
               L17 x3073 x1003 ADD   R0,R0,R3
(lc3sim) 
PC=x3074 IR=x1003 PSR=x0200 (POSITIVE)
R0=x0022 R1=xFF8D R2=x0040 R3=x0011 R4=x324A R5=xEFFB R6=xEF91 R7=x0000 
                   x3074 x14BF ADD   R2,R2,#-1
(lc3sim) 
PC=x3075 IR=x14BF PSR=x0200 (POSITIVE)
R0=x0022 R1=xFF8D R2=x003F R3=x0011 R4=x324A R5=xEFFB R6=xEF91 R7=x0000 
                   x3075 x0BFD BRNP  L17
```

This is a repetad addition of the register R0 (initial value is 0) with R3, then R2 is decremented, and repeat while R2 is positive. We can see it more clearly from this disassembly result.

```
	ADD R0, R0, R3
	ADD R2, R2, #-1
	BRnp lbl2
```

The end result of this operation is basically just R0 = R3 * R2, in this case we found that R0 = 0x41 * 0x11 = 0x451.

Then,

```
PC=x3086 IR=x14A3 PSR=x0200 (POSITIVE)
R0=x30E0 R1=xFF8D R2=x32A7 R3=x0451 R4=x324A R5=xEFFB R6=xEF93 R7=x0000 
                   x3086 x6480 LDR   R2,R2,#0
(lc3sim) 
PC=x3087 IR=x6480 PSR=x0200 (POSITIVE)
R0=x30E0 R1=xFF8D R2=x0539 R3=x0451 R4=x324A R5=xEFFB R6=xEF93 R7=x0000 
                   x3087 x16C2 ADD   R3,R3,R2
(lc3sim) 
PC=x3088 IR=x16C2 PSR=x0200 (POSITIVE)
R0=x30E0 R1=xFF8D R2=x0539 R3=x098A R4=x324A R5=xEFFB R6=xEF93 R7=x0000 
                   x3088 x777F STR   R3,R5,#-1
```

We can see that the result 0x451 is moved to R3, then a new value 0x539 = 1337 is loaded from address 0x32A7 to R2. It is then added into R3. The result is R3 = 0x451 + 0x539 = 0x98A. Let's keep tracking that number.


At some point a suspiciously same value 0x98A is loaded from memory 0x324A to R7,
```
PC=x308C IR=x1FC2 PSR=x0200 (POSITIVE)
R0=x30E0 R1=xFF8D R2=x324A R3=x098A R4=x324A R5=xEFFB R6=xEF93 R7=x324A 
                   x308C x6FC0 LDR   R7,R7,#0
(lc3sim) n
PC=x308D IR=x6FC0 PSR=x0200 (POSITIVE)
R0=x30E0 R1=xFF8D R2=x324A R3=x098A R4=x324A R5=xEFFB R6=xEF93 R7=x098A 
                   x308D x1DBF ADD   R6,R6,#-1
```


What happens next is that,
```
PC=x3091 IR=x7F80 PSR=x0800 (NEGATIVE)
R0=x30E0 R1=xFF8D R2=x324A R3=x098A R4=x324A R5=xEFFB R6=xEF91 R7=x098A 
                   x3091 x9FFF NOT   R7,R7
(lc3sim) 
PC=x3092 IR=x9FFF PSR=x0800 (NEGATIVE)
R0=x30E0 R1=xFF8D R2=x324A R3=x098A R4=x324A R5=xEFFB R6=xEF91 R7=xF675 
                   x3092 x1FE1 ADD   R7,R7,#1
(lc3sim) 
PC=x3093 IR=x1FE1 PSR=x0800 (NEGATIVE)
R0=x30E0 R1=xFF8D R2=x324A R3=x098A R4=x324A R5=xEFFB R6=xEF91 R7=xF676 
                   x3093 x10C7 ADD   R0,R3,R7
(lc3sim) 
PC=x3094 IR=x10C7 PSR=x0400 (ZERO)
R0=x0000 R1=xFF8D R2=x324A R3=x098A R4=x324A R5=xEFFB R6=xEF91 R7=xF676 
                   x3094 x6F80 LDR   R7,R6,#0
```

R0 = R3 + ~(R7 + 1) = R3 - R7 = 0x0000, where the symbol '~' denotes bitwise NOT. Then the value at R0 will be transferred into R7 (not shown here).



```
PC=x30A1 IR=x66C0 PSR=x0400 (ZERO)
R0=x30E0 R1=xFF8D R2=x324A R3=x0000 R4=x324A R5=xEFFB R6=xEF93 R7=x0000 
                   x30A1 x9FFF NOT   R7,R7
(lc3sim) 
PC=x30A2 IR=x9FFF PSR=x0800 (NEGATIVE)
R0=x30E0 R1=xFF8D R2=x324A R3=x0000 R4=x324A R5=xEFFB R6=xEF93 R7=xFFFF 
                   x30A2 x1FE1 ADD   R7,R7,#1
(lc3sim) 
PC=x30A3 IR=x1FE1 PSR=x0400 (ZERO)
R0=x30E0 R1=xFF8D R2=x324A R3=x0000 R4=x324A R5=xEFFB R6=xEF93 R7=x0000 
                   x30A3 x1FC3 ADD   R7,R7,R3
(lc3sim) 
PC=x30A4 IR=x1FC3 PSR=x0400 (ZERO)
R0=x30E0 R1=xFF8D R2=x324A R3=x0000 R4=x324A R5=xEFFB R6=xEF93 R7=x0000 
                   x30A4 x0A07 BRNP  L20
```


The constant 0x0000 is loaded into R3 then subtracted with R7. The result is compared, if it is negative or positive then we will jump somewhere, but here the jump is not taken and instead we go back to an earlier address of the code. 

If we set a breakpoint at 0x30A1 and inspect it again in the next iteration,
```
PC=x30A1 IR=x66C0 PSR=x0400 (ZERO)
R0=x30E0 R1=xFF8D R2=x324A R3=x0000 R4=x324A R5=xEFFB R6=xEF93 R7=xFEDF 
B                  x30A1 x9FFF NOT   R7,R7
(lc3sim) n
PC=x30A2 IR=x9FFF PSR=x0200 (POSITIVE)
R0=x30E0 R1=xFF8D R2=x324A R3=x0000 R4=x324A R5=xEFFB R6=xEF93 R7=x0120 
                   x30A2 x1FE1 ADD   R7,R7,#1
(lc3sim) 
PC=x30A3 IR=x1FE1 PSR=x0200 (POSITIVE)
R0=x30E0 R1=xFF8D R2=x324A R3=x0000 R4=x324A R5=xEFFB R6=xEF93 R7=x0121 
                   x30A3 x1FC3 ADD   R7,R7,R3
(lc3sim) 
PC=x30A4 IR=x1FC3 PSR=x0200 (POSITIVE)
R0=x30E0 R1=xFF8D R2=x324A R3=x0000 R4=x324A R5=xEFFB R6=xEF93 R7=x0121 
                   x30A4 x0A07 BRNP  L20
(lc3sim) 
PC=x30AC IR=x0A07 PSR=x0200 (POSITIVE)
R0=x30E0 R1=xFF8D R2=x324A R3=x0000 R4=x324A R5=xEFFB R6=xEF93 R7=x0121 
               L20 x30AC x6F40 LDR   R7,R5,#0
(lc3sim) c
Failed
```

We can see that the jump is taken and we failed. 

So we can conclude that the only thing this program does is it takes each character of our input and and does,
```c
if (input[i] * 0x11 + 1337 != *(0x324A)[i])
    fail()
```

We can see all the constant for comparison starting at address 0x324A and remember that each constant is 2-byte long in LC-3.
```
(lc3sim) dump 0x324A
3240:                                                   098A 0AAB            ..
324C: 0A34 098A 0AEF 0D64 0BBB 087A 08E0 08BE 0B88 08AD 0C87 0BDD  ............
3258: 0B88 08CF 08AD 08E0 089C 08BE 0B88 0BBB 0C65 08AD 0BBB 0C65  ............
3264: 08AD 0B88 0B88 0D20 0C21 0869 0B88 0C65 087A 0C54 089C 08BE  ............
3270: 0B88 0AAB 0A12 0ABC 09AC 0B88 08AD 0CCB 0BCC 0C21 087A 08E0  ............
327C: 089C 0BCC 08E0 0CFE 0CCB 089C 0B88 08AD 0C87 0D42 0D20 08AD  ............
3288: 0D42 0D86 32BB 3057 30D5 30E0 310B 311F 31D7 0053 0075 0063  .........Suc
3294: 0063 0065 0073 0073 0000 0040 0046 0061 0069 006C 0065 0064  cess.@Failed
32A0: 0020 0025 0064 0020 0025 0064 0000 0539 0011 0000             %d %d....  
```


Here is how we can reverse the flag after we extract all the constant.
```python
enc_flag = [2442, 2731, 2612, 2442, 2799, 3428, 3003, 2170, 2272, 2238, 
    2952, 2221, 3207, 3037, 2952, 2255, 2221, 2272, 2204, 2238, 
    2952, 3003, 3173, 2221, 3003, 3173, 2221, 2952, 2952, 3360, 
    3105, 2153, 2952, 3173, 2170, 3156, 2204, 2238, 2952, 2731, 
    2578, 2748, 2476, 2952, 2221, 3275, 3020, 3105, 2170, 2272, 
    2204, 3020, 2272, 3326, 3275, 2204, 2952, 2221, 3207, 3394, 
    3360, 2221, 3394, 3462]

flag = b"".join([bytes([(num - 1337) // 0x11]) for num in enc_flag])
print(flag.decode())

```