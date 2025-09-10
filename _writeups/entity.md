---
layout: writeup
title: Entity
source: HackTheBox
date: 2025-05-07
read_time: 5 mins?
---
I start by downloading the challenge archive and unzipping the folder to reveal 3 files.
![](/assets/images/writeups/HackTheBox/Entity/enumeration.png)
The first is the vulnerable executable, the second is the source code so that disassembly is not a requirement, and the thiassets/images/Writeups/HackTheBox/Entity/enumeration.pngrd is a dummy flag text file to help determine when the challenge has been solved.
Once I have determined what the challenge provides, I run the executable to see what I can learn from dynamic analysis.
![](/assets/images/writeups/HackTheBox/Entity/first_run.png)
I don't learn much besides the fact that input is case sensitive. Additionally, I get a sense of what the program does as I'm guessing it executes these options in a loop until the flag is uncovered. To understand better what these options mean, I check out the source code and see what I can uncover.
![](/assets/images/writeups/HackTheBox/Entity/main_and_answer.png)
Immediately, I am met with a function that will print the flag if executed and DataStore.integer == 13371337. The main function doesn't tell me much besides the fact that whichever option I choose when the program runs leads me to a different function. I have no idea what DataStore.integer is, so I look around trying to find out more.
![](/assets/images/writeups/HackTheBox/Entity/menu.png)
From the main function, the menu function was called, so I decide to check this out first to see if there's any easy tricks for this challenge that might lead me straight to the flag function.
The first thing I notice is that entering the "C" option sets the act value in the res struct to FLAG. I make a guess that this calls the get_flag function, so, logically, I try that next.
![](/assets/images/writeups/HackTheBox/Entity/second_try.png)
Obviously, the challenge is not that simple. I knew this before I even tried, but if it ended up being the solution after hours of work, I wouldn't be happy with myself for not trying in the first place. In fact, I do learn after re-examining the get_flag function that the output provided means that all I have to do now is set the DataStore.integer value to 13371337.
That being said, my next step was to go back to the source code and try to determine what my options are for doing that.
![](/assets/images/writeups/HackTheBox/Entity/set_field.png)
I already know through my analysis of the main and menu functions that I only have two options for what to check out next and since I need to set some value, I look at the option that stems from inputting "T". This option sets the res.act member to STORE_SET, leading me to the set_field function. Additionally, choosing the "L" option after "T" sets the res.field member to INTEGER and since DataStore needs to be an integer, I try this option.
![](/assets/images/writeups/HackTheBox/Entity/attempt_three.png)
Upon entering 13371337, I do not get the flag, so I re-examine the source code to find that the set_field function has a check to catch exactly what I just tried to do - duh. Now, with a decent sense of what the program does and an understanding of my goal, I could elect to continue static analysis by reverse engineering the source code to figure out exactly what I need to do to solve the challenge. However, I decide to take the simpler route and dynamically "brute force" many different options quickly in order to develop my understanding of the program beyond the simple level that I already do.
![](/assets/images/writeups/HackTheBox/Entity/making_progress.png)
This method pays off when eventually I try an interesting combination of inputs that seems to provide a stepping stone into the solution the author intended.
I know that entering 13371337 as an integer does not work, so I instead elect to try the only other option I have - seeing how strings work. This leads to my discovery that reading a string as an integer will actually produce a desirable result and not just nonsense.
With this knowledge, I return to the source code to see what other mysteries of this challenge I can uncover.
![](/assets/images/writeups/HackTheBox/Entity/get_field.png)
Upon return, I immediately look to the get_field as it is the only remaining function that I have yet to examine.
The first thing I notice is there is no check for 13371337 - or something similar - to find in this function. That means if I can somehow figure out what the 13371337 integer translates to in this program, I should be able to uncover the flag. This already serves as a difficult problem based on my latest attempt because the result from entering "AAAA" does not seem to result in ASCII integers as far as I can tell.
This all leads me to some more dynamic analysis - this time with the help of gdb.
![](/assets/images/writeups/HackTheBox/Entity/set_field_gdb.png)
I locate the assembly code for the set_field function and discover the address that stores the data I input, aptly named DataStore. I examine the memory contents of this address after entering "A" as my string input to find that a newline character has been appended.
![](/assets/images/writeups/HackTheBox/Entity/DataStore_gdb.png)
This gives me enough new information to formulate a hypothesis and come up with an experiment to test this hypothesis.
![](/assets/images/writeups/HackTheBox/Entity/just_A.png)
My experiment begins with running the code again, entering just a single "A" (as I did in gdb) in order to figure out what the integer representation would be according to the program.
I know there's no funny business since I didn't find any encoding functions or other cryptographic algorithms that might change the string into non-ASCII, so I consult my favorite format conversion website: [RapidTables](https://www.rapidtables.com/convert/number/hex-to-decimal.html?x=A41). 