class Middleware:
    def __init__(self, jihyo, k4tou, rounds=1000):
        self.jihyo = jihyo
        self.k4tou = k4tou
        self.rounds = rounds

    def run(self):
        for bit in range(self.rounds):
            setup = self.jihyo.begin()
            vmsg  = self.k4tou.choose(setup, bit)
            emsg  = self.jihyo.answer(vmsg, bit)
            self.k4tou.absorb(emsg)